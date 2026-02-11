"use client";

import { useCallback } from "react";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useSearchStore } from "@/stores/search-store";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { apiGet, apiPost } from "@/lib/api/client";
import type { DiscoverySession, SessionStage, StartupCard } from "@/types";

/** Parse an SSE stream correctly, handling cross-chunk boundaries. */
function parseSseStream() {
  let currentEvent = "";
  let currentData = "";

  return {
    /** Feed raw text and get back fully-parsed events. */
    feed(chunk: string): Array<{ event: string; data: string }> {
      const events: Array<{ event: string; data: string }> = [];
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          currentData = line.slice(6);
        } else if (line === "" && currentEvent) {
          // Empty line = end of SSE event
          events.push({ event: currentEvent, data: currentData });
          currentEvent = "";
          currentData = "";
        }
      }

      return events;
    },
  };
}

export function useDiscoverySession() {
  const {
    sessionId,
    discoveryState,
    currentStage,
    messages,
    isStreaming,
    setSessionId,
    setDiscoveryState,
    setCurrentStage,
    addMessage,
    updateLastAssistantMessage,
    setIsStreaming,
    setMessages,
    reset: resetDiscovery,
  } = useDiscoveryStore();

  const { searchId, setSearchId, startPipeline, completePipeline, errorPipeline } =
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
    setCurrentStage("discovery");
    setDiscoveryState("chatting");
    return id;
  }, [setSessionId, setCurrentStage, setDiscoveryState]);

  const loadSession = useCallback(
    async (id: string) => {
      const session = await apiGet<DiscoverySession>(`/discovery/${id}`);
      setSessionId(session.id);
      setCurrentStage(session.currentStage);
      setMessages(
        session.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }))
      );
      if (session.isComplete) {
        setDiscoveryState("complete");
      } else if (session.messages.length > 0) {
        setDiscoveryState("chatting");
      } else {
        setDiscoveryState("idle");
      }
      return session;
    },
    [setSessionId, setCurrentStage, setMessages, setDiscoveryState]
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
        } catch {
          // Skip malformed JSON
        }
      }
    },
    [setPanelOpen, setActiveTab, setAnalysisStatus, appendThinking, appendPlanText]
  );

  // ═══════════════════════════════════════════
  // Process Scout events — cards go to panel
  // ═══════════════════════════════════════════
  const processScoutEvents = useCallback(
    (parser: ReturnType<typeof parseSseStream>, chunk: string) => {
      const events = parser.feed(chunk);

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
            setScoutProgress(100, "Busca concluida");

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
                  "Nenhuma startup encontrada para os criterios definidos. Tente ajustar sua busca.",
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
        } catch {
          // Skip malformed JSON
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
      const parser = parseSseStream();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Scout events come as named SSE events
        processScoutEvents(parser, chunk);

        // Also check for plain data lines (status messages)
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                addMessage({
                  role: "assistant",
                  content: `Erro: ${data.error}`,
                  type: "stage-update",
                });
                errorPipeline();
              }
            } catch {
              // Skip
            }
          }
        }
      }
    } catch (error) {
      console.error("Scout stream error:", error);
      addMessage({
        role: "assistant",
        content: "Erro de conexao com o pipeline. Tente novamente.",
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
    processScoutEvents,
  ]);

  // ═══════════════════════════════════════════
  // Unified sendMessage — routes through conductor
  // ═══════════════════════════════════════════
  const sendMessage = useCallback(
    async (text: string, sid?: string) => {
      const activeSessionId = sid ?? sessionId;
      if (!activeSessionId) return;

      addMessage({ role: "user", content: text });
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
        const sseParser = parseSseStream();
        let assistantMsg = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          // Handle named SSE events (analysis events)
          const sseEvents = sseParser.feed(chunk);
          if (sseEvents.length > 0) {
            processAnalysisEvents(sseEvents);
          }

          // Handle unnamed data: lines (text chunks, done, status, error)
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                // Text chunks (discovery or advisor)
                if (data.text) {
                  assistantMsg += data.text;
                  updateLastAssistantMessage(assistantMsg);
                }

                // Status messages
                if (data.status) {
                  addMessage({
                    role: "assistant",
                    content: data.status,
                    type: "stage-update",
                  });
                }

                // Done event
                if (data.done) {
                  if (data.transition === "awaiting_confirmation" && data.searchId) {
                    // Discovery + analysis complete in one response
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
              } catch {
                // Skip malformed SSE data lines
              }
            }
          }
        }

        setIsStreaming(false);
      } catch (error) {
        console.error("Session error:", error);
        setIsStreaming(false);
      }
    },
    [
      sessionId,
      addMessage,
      updateLastAssistantMessage,
      setIsStreaming,
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
  }, [resetDiscovery, resetPanel]);

  return {
    sessionId,
    discoveryState,
    currentStage,
    messages,
    isStreaming,
    initSession,
    loadSession,
    sendMessage,
    confirmPlan,
    reset,
  };
}
