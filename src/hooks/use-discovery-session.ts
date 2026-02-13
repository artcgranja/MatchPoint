"use client";

import { useCallback, useRef } from "react";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useSearchStore } from "@/stores/search-store";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { apiGet, apiPost } from "@/lib/api/client";
import { createSseParser } from "@/lib/sse/parser";
import type { DiscoveryMessage, DiscoverySession, SessionStage, StartupCard } from "@/types";

export function useDiscoverySession() {
  const {
    sessionId,
    discoveryState,
    currentStage,
    messages,
    isStreaming,
    isLoadingSession,
    setSessionId,
    setDiscoveryState,
    setCurrentStage,
    addMessage,
    updateLastAssistantMessage,
    setIsStreaming,
    setSessionTitle,
    setIsLoadingSession,
    setMessages,
    reset: resetDiscovery,
  } = useDiscoveryStore();

  const loadSessionAbortRef = useRef<AbortController | null>(null);

  const { searchId, setSearchId, startPipeline, completePipeline, errorPipeline, resetPipeline } =
    useSearchStore();

  const {
    setPanelOpen,
    setActiveTab,
    setAnalysisStatus,
    appendThinking,
    appendPlanText,
    setScoutStatus,
    setScoutProgress,
    addToolCall,
    updateToolCall,
    setCards,
    reset: resetPanel,
  } = useAgentPanelStore();

  const initSession = useCallback(async () => {
    const { id } = await apiPost<{ id: string }>("/discovery");
    setSessionId(id);
    setSessionTitle(null);
    setCurrentStage("discovery");
    setDiscoveryState("chatting");
    return id;
  }, [setSessionId, setSessionTitle, setCurrentStage, setDiscoveryState]);

  const loadSession = useCallback(
    async (id: string) => {
      // Abort any previous in-flight loadSession
      loadSessionAbortRef.current?.abort();
      const abortController = new AbortController();
      loadSessionAbortRef.current = abortController;

      setIsLoadingSession(true);
      try {
        const session = await apiGet<DiscoverySession>(`/discovery/${id}`);

        // If this request was aborted (user clicked another session), bail out
        if (abortController.signal.aborted) return;

        setSessionId(session.id);
        setSessionTitle(session.title ?? null);
        setCurrentStage(session.currentStage);

        // Build messages array from discovery messages
        const msgs: DiscoveryMessage[] = session.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          createdAt: m.createdAt,
        }));

        // Restore search execution state if it exists
        const search = session.searchExecution;
        if (search) {
          setSearchId(search.id);

          // Restore analysis panel
          if (search.productDocument) {
            appendPlanText(search.productDocument);
            setAnalysisStatus("confirmed");
          }

          // Restore scout cards
          if (search.cards.length > 0) {
            setCards(search.cards, search.scoutSummary ?? "");
            setScoutStatus("complete");
            setScoutProgress(100, "Busca concluída");
            setPanelOpen(true);
            setActiveTab("scout");

            // Add cards message to chat
            msgs.push({
              role: "assistant",
              content: `${search.cards.length} startups encontradas! Veja os resultados no painel.`,
              type: "cards",
              cards: search.cards,
            });
          }

          if (search.status === "complete") {
            completePipeline();
          }

          // Restore advisor messages
          if (search.orchestratorMessages.length > 0) {
            for (const m of search.orchestratorMessages) {
              msgs.push({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
                createdAt: m.createdAt,
              });
            }
          }
        }

        setMessages(msgs);

        // Set discovery state based on stage
        if (session.currentStage === "advising") {
          setDiscoveryState("advising");
        } else if (session.isComplete) {
          setDiscoveryState("complete");
        } else if (session.messages.length > 0) {
          setDiscoveryState("chatting");
        } else {
          setDiscoveryState("idle");
        }

        return session;
      } finally {
        // Only clear loading if this is still the active request
        if (!abortController.signal.aborted) {
          setIsLoadingSession(false);
        }
      }
    },
    [
      setSessionId,
      setSessionTitle,
      setCurrentStage,
      setMessages,
      setDiscoveryState,
      setIsLoadingSession,
      setSearchId,
      appendPlanText,
      setAnalysisStatus,
      setCards,
      setScoutStatus,
      setScoutProgress,
      setPanelOpen,
      setActiveTab,
      completePipeline,
    ]
  );

  // ═══════════════════════════════════════════
  // Process Analysis events from SSE stream
  // ═══════════════════════════════════════════
  const processAnalysisEvents = useCallback(
    (sseEvents: Array<{ event: string; data: string }>) => {
      for (const sse of sseEvents) {
        try {
          const data = JSON.parse(sse.data);

          if (sse.event === "analysis_thinking") {
            setPanelOpen(true);
            setActiveTab("analysis");
            setAnalysisStatus("thinking");
            const text = data.data?.text ?? "";
            if (text) appendThinking(text);
          }

          if (sse.event === "analysis_text") {
            setAnalysisStatus("writing");
            const text = data.data?.text ?? "";
            if (text) appendPlanText(text);
          }

          if (sse.event === "analysis_complete") {
            setAnalysisStatus("complete");
          }
        } catch (err) {
          console.warn("[SSE] Malformed analysis event:", err);
        }
      }
    },
    [setPanelOpen, setActiveTab, setAnalysisStatus, appendThinking, appendPlanText]
  );

  // ═══════════════════════════════════════════
  // Process Scout events — cards go to panel
  // ═══════════════════════════════════════════
  const processScoutNamedEvents = useCallback(
    (events: Array<{ event: string; data: string }>) => {
      for (const sse of events) {
        try {
          const data = JSON.parse(sse.data);

          if (sse.event === "stage_update" || sse.event === "stage_complete") {
            const stageMap: Record<string, SessionStage> = {
              Scout: "scout",
            };
            const stage = stageMap[data.agentName];
            if (stage && sse.event === "stage_update") {
              if (data.progress === 0) {
                setCurrentStage(stage);
                setActiveTab("scout");
                setPanelOpen(true);
                setScoutStatus("searching");
              }
              setScoutProgress(data.progress, data.message ?? "");
            }
          }

          // Tool call events
          if (sse.event === "scout_tool_call") {
            addToolCall({
              id: data.data?.toolCallId ?? data.data?.id ?? crypto.randomUUID(),
              toolName: data.data?.toolName ?? "unknown",
              input: data.data?.input ?? {},
              status: "running",
              timestamp: Date.now(),
            });
          }

          if (sse.event === "scout_tool_result") {
            const toolCallId = data.data?.toolCallId ?? data.data?.id;
            if (toolCallId) {
              updateToolCall(toolCallId, {
                status: "complete",
                resultSummary: data.data?.resultSummary,
              });
            }
          }

          if (sse.event === "pipeline_complete") {
            const payload = data.data as
              | { cards?: StartupCard[]; summary?: string }
              | undefined;
            const cards = payload?.cards ?? [];
            const summary = payload?.summary ?? "";

            // Cards go to the agent panel, not chat
            setCards(cards, summary);
            setScoutStatus("complete");
            setScoutProgress(100, "Busca concluída");

            if (cards.length > 0) {
              addMessage({
                role: "assistant",
                content: `${cards.length} startups encontradas! Veja os resultados no painel.`,
                type: "cards",
                cards,
              });
            } else {
              addMessage({
                role: "assistant",
                content:
                  summary ||
                  "Nenhuma startup encontrada para os critérios definidos. Tente ajustar sua busca.",
              });
            }

            setCurrentStage("advising");
            setDiscoveryState("advising");
            completePipeline();
          }

          if (sse.event === "error") {
            addMessage({
              role: "assistant",
              content: `Erro no pipeline: ${data.message}`,
              type: "stage-update",
            });
            setScoutStatus("error");
            setCurrentStage("complete");
            setDiscoveryState("complete");
            errorPipeline();
          }
        } catch (err) {
          console.warn("[SSE] Malformed scout event:", err);
        }
      }
    },
    [
      addMessage,
      completePipeline,
      errorPipeline,
      setCurrentStage,
      setDiscoveryState,
      setActiveTab,
      setPanelOpen,
      setScoutStatus,
      setScoutProgress,
      addToolCall,
      updateToolCall,
      setCards,
    ]
  );

  // ═══════════════════════════════════════════
  // Confirm Plan → Run Scout via Conductor
  // ═══════════════════════════════════════════
  const confirmPlan = useCallback(async () => {
    const activeSessionId = sessionId ?? useDiscoveryStore.getState().sessionId;
    const activeSearchId = searchId ?? useSearchStore.getState().searchId;
    if (!activeSessionId || !activeSearchId) return;

    useAgentPanelStore.getState().confirmPlan();
    setActiveTab("scout");
    setScoutStatus("searching");
    setScoutProgress(0, "Iniciando busca...");
    setCurrentStage("scout");
    addMessage({
      role: "assistant",
      content: "Plano confirmado! Buscando startups...",
      type: "stage-update",
    });

    try {
      const res = await fetch(
        `/api/v1/sessions/${activeSessionId}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Confirmo o plano. Buscar startups." }),
        }
      );

      if (!res.body) {
        errorPipeline();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const parser = createSseParser();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        const events = parser.feed(chunk);

        // Named events → scout handler
        const namedEvents = events.filter((e) => e.event !== "message");
        if (namedEvents.length > 0) {
          processScoutNamedEvents(namedEvents);
        }

        // Unnamed events (error messages)
        for (const sse of events) {
          if (sse.event !== "message") continue;
          try {
            const data = JSON.parse(sse.data);
            if (data.error) {
              addMessage({
                role: "assistant",
                content: `Erro: ${data.error}`,
                type: "stage-update",
              });
              errorPipeline();
            }
          } catch (err) {
            console.warn("[SSE] Malformed data line:", err);
          }
        }
      }
    } catch (error) {
      console.error("Scout stream error:", error);
      addMessage({
        role: "assistant",
        content: "Erro de conexão com o pipeline. Tente novamente.",
        type: "stage-update",
      });
      setScoutStatus("error");
      setCurrentStage("complete");
      setDiscoveryState("complete");
      errorPipeline();
    }
  }, [
    sessionId,
    searchId,
    errorPipeline,
    setCurrentStage,
    setDiscoveryState,
    setActiveTab,
    setScoutStatus,
    setScoutProgress,
    addMessage,
    processScoutNamedEvents,
  ]);

  // ═══════════════════════════════════════════
  // Unified sendMessage — routes through conductor
  // ═══════════════════════════════════════════
  const sendMessage = useCallback(
    async (text: string, sid?: string) => {
      const activeSessionId = sid ?? sessionId;
      if (!activeSessionId) return;

      addMessage({ role: "user", content: text });
      if (!useDiscoveryStore.getState().sessionTitle) {
        setSessionTitle(text.slice(0, 60));
      }
      setIsStreaming(true);

      try {
        const res = await fetch(
          `/api/v1/sessions/${activeSessionId}/message`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text }),
          }
        );

        if (!res.body) {
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const sseParser = createSseParser();
        let assistantMsg = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const sseEvents = sseParser.feed(chunk);

          // Named events → analysis handler
          const namedEvents = sseEvents.filter((e) => e.event !== "message");
          if (namedEvents.length > 0) {
            processAnalysisEvents(namedEvents);
          }

          // Unnamed events (text chunks, done, status, error)
          for (const sse of sseEvents) {
            if (sse.event !== "message") continue;
            try {
              const data = JSON.parse(sse.data);

              if (data.text) {
                assistantMsg += data.text;
                updateLastAssistantMessage(assistantMsg);
              }

              if (data.status) {
                addMessage({
                  role: "assistant",
                  content: data.status,
                  type: "stage-update",
                });
              }

              if (data.done) {
                if (data.transition === "awaiting_confirmation" && data.searchId) {
                  setDiscoveryState("processing");
                  setCurrentStage("analysis");
                  setSearchId(data.searchId);
                  startPipeline();
                }
              }

              if (data.error) {
                addMessage({
                  role: "assistant",
                  content: `Erro: ${data.error}`,
                  type: "stage-update",
                });
                errorPipeline();
              }
            } catch (err) {
              console.warn("[SSE] Malformed data line:", err);
            }
          }
        }

        setIsStreaming(false);
      } catch (error) {
        console.error("Session error:", error);
        addMessage({
          role: "assistant",
          content: "Erro de conexão. Verifique sua rede e tente novamente.",
          type: "stage-update",
        });
        setIsStreaming(false);
      }
    },
    [
      sessionId,
      addMessage,
      updateLastAssistantMessage,
      setIsStreaming,
      setSessionTitle,
      setDiscoveryState,
      setCurrentStage,
      setSearchId,
      startPipeline,
      errorPipeline,
      processAnalysisEvents,
    ]
  );

  const reset = useCallback(() => {
    resetDiscovery();
    resetPanel();
    resetPipeline();
  }, [resetDiscovery, resetPanel, resetPipeline]);

  return {
    sessionId,
    discoveryState,
    currentStage,
    messages,
    isStreaming,
    isLoadingSession,
    initSession,
    loadSession,
    sendMessage,
    confirmPlan,
    reset,
  };
}
