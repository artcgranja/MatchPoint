"use client";

import { useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useSearchStore } from "@/stores/search-store";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { apiGet, apiPost } from "@/lib/api/client";
import { createSseParser } from "@/lib/sse/parser";
import { useQuestionWizardStore } from "@/stores/question-wizard-store";
import type { BizDevPlanStatus, DiscoveryMessage, DiscoverySession, QuestionAnswer, QuestionData, SessionStage, StartupCard } from "@/types";

export function useDiscoverySession() {
  const tPipeline = useTranslations("Pipeline");

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

  const resetPanel = useAgentPanelStore((s) => s.reset);

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
        // API may return extended fields (type, questions, etc.) not in the base DiscoveryMessage type
        const msgs: DiscoveryMessage[] = [];
        for (const m of session.messages) {
          const raw = m as unknown as Record<string, unknown>;

          // Skip silent question_answers user messages (no chat bubble)
          if (raw.type === "question_answers") continue;

          const msg: DiscoveryMessage = {
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            createdAt: m.createdAt,
          };

          // Restore questions metadata from DB
          if (raw.type === "questions") {
            msg.type = "questions";
            msg.questions = raw.questions as DiscoveryMessage["questions"];
            msg.questionsContext = raw.questionsContext as string | undefined;
            msg.questionsAnswered = raw.questionsAnswered as boolean | undefined;
            msg.questionsAnswers = raw.questionsAnswers as DiscoveryMessage["questionsAnswers"];
          }

          msgs.push(msg);
        }

        // Restore search execution state if it exists
        const search = session.searchExecution;
        if (search) {
          setSearchId(search.id);

          // Restore analysis panel
          if (search.productDocument) {
            // If awaiting confirmation, show the approval button ("complete")
            // Otherwise, the user already confirmed ("confirmed")
            if (session.awaitingConfirmation) {
              useAgentPanelStore.getState().batchUpdate({
                planText: search.productDocument,
                analysisStatus: "complete",
                panelOpen: true,
                activeTab: "analysis",
              });
            } else {
              useAgentPanelStore.getState().batchUpdate({
                planText: search.productDocument,
                analysisStatus: "confirmed",
              });
            }
          }

          // Restore scout cards
          if (search.cards.length > 0) {
            useAgentPanelStore.getState().batchUpdate({
              cards: search.cards,
              scoutSummary: search.scoutSummary ?? "",
              scoutStatus: "complete",
              scoutProgress: 100,
              scoutMessage: tPipeline("searchComplete"),
              panelOpen: true,
              activeTab: "scout",
            });

            // Add cards message to chat
            msgs.push({
              role: "assistant",
              content: tPipeline("startupsFoundChat", { count: search.cards.length }),
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

        // Reopen wizard for unanswered questions
        const unanswered = msgs.findLast(
          (m) => m.type === "questions" && !m.questionsAnswered
        );
        if (unanswered?.questions) {
          useQuestionWizardStore.getState().openWizard(
            unanswered.questions,
            unanswered.questionsContext
          );
        }

        // Set discovery state based on stage
        if (session.awaitingConfirmation) {
          setDiscoveryState("processing");
        } else if (session.currentStage === "advising") {
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
      completePipeline,
      tPipeline,
    ]
  );

  // ═══════════════════════════════════════════
  // Process Analysis events from SSE stream (batched)
  // ═══════════════════════════════════════════
  const processAnalysisEvents = useCallback(
    (sseEvents: Array<{ event: string; data: string }>) => {
      const store = useAgentPanelStore.getState();
      let thinkingAccum = "";
      let planAccum = "";
      let newStatus: BizDevPlanStatus | null = null;
      let shouldOpenPanel = false;
      let shouldSetTab = false;

      for (const sse of sseEvents) {
        try {
          const data = JSON.parse(sse.data);

          if (sse.event === "analysis_thinking") {
            shouldOpenPanel = true;
            shouldSetTab = true;
            newStatus = "thinking";
            const text = data.data?.text ?? "";
            if (text) thinkingAccum += text;
          }

          if (sse.event === "analysis_text") {
            newStatus = "writing";
            const text = data.data?.text ?? "";
            if (text) planAccum += text;
          }

          if (sse.event === "analysis_complete") {
            newStatus = "complete";
          }
        } catch (err) {
          console.warn("[SSE] Malformed analysis event:", err);
        }
      }

      // Single batch update for all accumulated changes
      const batch: Record<string, unknown> = {};
      if (shouldOpenPanel) batch.panelOpen = true;
      if (shouldSetTab) batch.activeTab = "analysis";
      if (newStatus) batch.analysisStatus = newStatus;
      if (thinkingAccum) batch.thinkingText = store.thinkingText + thinkingAccum;
      if (planAccum) batch.planText = store.planText + planAccum;

      if (Object.keys(batch).length > 0) {
        useAgentPanelStore.getState().batchUpdate(batch);
      }
    },
    []
  );

  // ═══════════════════════════════════════════
  // Process Scout events — cards go to panel (batched)
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
            const resolvedMessage = data.key
              ? tPipeline(data.key as Parameters<typeof tPipeline>[0], data.params ?? {})
              : (data.message ?? "");
            if (stage && sse.event === "stage_update") {
              if (data.progress === 0) {
                setCurrentStage(stage);
                // Batch panel open + tab + status + progress
                useAgentPanelStore.getState().batchUpdate({
                  activeTab: "scout",
                  panelOpen: true,
                  scoutStatus: "searching",
                  scoutProgress: data.progress,
                  scoutMessage: resolvedMessage,
                });
              } else {
                useAgentPanelStore.getState().batchUpdate({
                  scoutProgress: data.progress,
                  scoutMessage: resolvedMessage,
                });
              }
            }
          }

          // Tool call events
          if (sse.event === "scout_tool_call") {
            const store = useAgentPanelStore.getState();
            useAgentPanelStore.getState().batchUpdate({
              toolCalls: [...store.toolCalls, {
                id: data.data?.toolCallId ?? data.data?.id ?? crypto.randomUUID(),
                toolName: data.data?.toolName ?? "unknown",
                input: data.data?.input ?? {},
                status: "running" as const,
                timestamp: Date.now(),
              }],
            });
          }

          if (sse.event === "scout_tool_result") {
            const toolCallId = data.data?.toolCallId ?? data.data?.id;
            if (toolCallId) {
              const store = useAgentPanelStore.getState();
              useAgentPanelStore.getState().batchUpdate({
                toolCalls: store.toolCalls.map((tc) =>
                  tc.id === toolCallId ? { ...tc, status: "complete" as const, resultSummary: data.data?.resultSummary } : tc
                ),
              });
            }
          }

          if (sse.event === "pipeline_complete") {
            const payload = data.data as
              | { cards?: StartupCard[]; summary?: string }
              | undefined;
            const cards = payload?.cards ?? [];
            const summary = payload?.summary ?? "";

            // Batch all agent-panel mutations into one set()
            useAgentPanelStore.getState().batchUpdate({
              cards,
              scoutSummary: summary,
              scoutStatus: "complete",
              scoutProgress: 100,
              scoutMessage: data.key ? tPipeline(data.key as Parameters<typeof tPipeline>[0], data.params ?? {}) : tPipeline("searchComplete"),
            });

            if (cards.length > 0) {
              addMessage({
                role: "assistant",
                content: tPipeline("startupsFoundChat", { count: cards.length }),
                type: "cards",
                cards,
              });
            } else {
              addMessage({
                role: "assistant",
                content:
                  summary ||
                  tPipeline("noStartupsFound"),
              });
            }

            setCurrentStage("advising");
            setDiscoveryState("advising");
            completePipeline();
          }

          if (sse.event === "error") {
            addMessage({
              role: "assistant",
              content: tPipeline("pipelineError", { message: data.message }),
              type: "stage-update",
            });
            useAgentPanelStore.getState().batchUpdate({ scoutStatus: "error" });
            setCurrentStage("complete");
            setDiscoveryState("complete");
            errorPipeline();
          }
        } catch (err) {
          console.warn("[SSE] Malformed scout event:", err);
        }
      }
    },
    [addMessage, completePipeline, errorPipeline, setCurrentStage, setDiscoveryState, tPipeline]
  );

  // ═══════════════════════════════════════════
  // Confirm Plan → Run Scout via Conductor
  // ═══════════════════════════════════════════
  const confirmPlan = useCallback(async () => {
    const activeSessionId = sessionId ?? useDiscoveryStore.getState().sessionId;
    const activeSearchId = searchId ?? useSearchStore.getState().searchId;
    if (!activeSessionId || !activeSearchId) return;

    useAgentPanelStore.getState().confirmPlan();
    useAgentPanelStore.getState().batchUpdate({
      activeTab: "scout",
      scoutStatus: "searching",
      scoutProgress: 0,
      scoutMessage: tPipeline("startingSearch"),
    });
    setCurrentStage("scout");
    addMessage({
      role: "assistant",
      content: tPipeline("planConfirmed"),
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
                content: tPipeline("error", { message: data.error }),
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
        content: tPipeline("pipelineConnectionError"),
        type: "stage-update",
      });
      useAgentPanelStore.getState().batchUpdate({ scoutStatus: "error" });
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
    addMessage,
    processScoutNamedEvents,
    tPipeline,
  ]);

  // ═══════════════════════════════════════════
  // Shared SSE stream processor (used by sendMessage and submitQuestionAnswers)
  // ═══════════════════════════════════════════
  const processDiscoveryStream = useCallback(
    async (res: Response) => {
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const sseParser = createSseParser();
      let assistantMsg = "";
      let textFinalized = false;
      let textRafId: number | null = null;
      const flushText = () => {
        if (textFinalized) return;
        updateLastAssistantMessage(assistantMsg);
        textRafId = null;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const sseEvents = sseParser.feed(chunk);

        // Named events → analysis handler + questions
        const namedEvents = sseEvents.filter((e) => e.event !== "message");
        if (namedEvents.length > 0) {
          const questionEvents = namedEvents.filter((e) => e.event === "interactive_questions");
          const analysisEvents = namedEvents.filter((e) => e.event !== "interactive_questions");

          if (analysisEvents.length > 0) {
            processAnalysisEvents(analysisEvents);
          }

          for (const qe of questionEvents) {
            try {
              const parsed = JSON.parse(qe.data);
              const payload = parsed.data as { questions: unknown[]; context?: string };
              if (!textFinalized && assistantMsg) {
                if (textRafId !== null) {
                  cancelAnimationFrame(textRafId);
                  textRafId = null;
                }
                updateLastAssistantMessage(assistantMsg);
                textFinalized = true;
              }

              // Auto-open the drawer wizard
              useQuestionWizardStore.getState().openWizard(
                payload.questions as QuestionData[],
                payload.context
              );

              // Track the questions message in chat (renders as answered card later)
              addMessage({
                role: "assistant",
                content: "",
                type: "questions",
                questions: payload.questions as DiscoveryMessage["questions"],
                questionsContext: payload.context,
              });
            } catch (err) {
              console.warn("[SSE] Malformed questions event:", err);
            }
          }
        }

        // Unnamed events (text chunks, done, status, error)
        for (const sse of sseEvents) {
          if (sse.event !== "message") continue;
          try {
            const data = JSON.parse(sse.data);

            if (data.text) {
              assistantMsg += data.text;
              if (textRafId === null) {
                textRafId = requestAnimationFrame(flushText);
              }
            }

            if (data.status) {
              if (!textFinalized && assistantMsg) {
                if (textRafId !== null) {
                  cancelAnimationFrame(textRafId);
                  textRafId = null;
                }
                updateLastAssistantMessage(assistantMsg);
                textFinalized = true;
              }
              const statusContent = data.statusKey
                ? tPipeline(data.statusKey as Parameters<typeof tPipeline>[0], data.statusParams ?? {})
                : data.status;
              addMessage({
                role: "assistant",
                content: statusContent,
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
              if (!textFinalized && assistantMsg) {
                if (textRafId !== null) {
                  cancelAnimationFrame(textRafId);
                  textRafId = null;
                }
                updateLastAssistantMessage(assistantMsg);
                textFinalized = true;
              }
              addMessage({
                role: "assistant",
                content: tPipeline("error", { message: data.error }),
                type: "stage-update",
              });
              errorPipeline();
            }
          } catch (err) {
            console.warn("[SSE] Malformed data line:", err);
          }
        }
      }

      // Final flush
      if (textRafId !== null) cancelAnimationFrame(textRafId);
      if (assistantMsg && !textFinalized) updateLastAssistantMessage(assistantMsg);
    },
    [
      addMessage,
      updateLastAssistantMessage,
      setDiscoveryState,
      setCurrentStage,
      setSearchId,
      startPipeline,
      errorPipeline,
      processAnalysisEvents,
      tPipeline,
    ]
  );

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

        await processDiscoveryStream(res);
        setIsStreaming(false);
      } catch (error) {
        console.error("Session error:", error);
        addMessage({
          role: "assistant",
          content: tPipeline("connectionError"),
          type: "stage-update",
        });
        setIsStreaming(false);
      }
    },
    [
      sessionId,
      addMessage,
      setIsStreaming,
      setSessionTitle,
      processDiscoveryStream,
      tPipeline,
    ]
  );

  // ═══════════════════════════════════════════
  // Silent answer submission (no user message bubble)
  // ═══════════════════════════════════════════
  const submitQuestionAnswers = useCallback(
    async (answers: QuestionAnswer[]) => {
      const activeSessionId = sessionId ?? useDiscoveryStore.getState().sessionId;
      if (!activeSessionId) return;

      // Build a rich format with original question text for each answer
      const currentMessages = useDiscoveryStore.getState().messages;
      const lastQ = currentMessages.findLast((m) => m.type === "questions" && !m.questionsAnswered);
      const questionsMap = new Map(
        (lastQ?.questions ?? []).map((q) => [q.id, q.question])
      );

      const formatted = answers
        .map((a) => {
          const label = questionsMap.get(a.questionId) ?? a.questionId;
          const selected = a.selected.join(", ");
          const custom = a.otherText ? ` (Custom: ${a.otherText})` : "";
          return `**${label}**: ${selected}${custom}`;
        })
        .join("\n");

      const text = `[Interactive Form Response]\n${formatted}`;

      // Mark the last unanswered questions message as answered + store answers
      const lastQIdx = currentMessages.findLastIndex(
        (m) => m.type === "questions" && !m.questionsAnswered
      );
      if (lastQIdx >= 0) {
        const updated = [...currentMessages];
        updated[lastQIdx] = {
          ...currentMessages[lastQIdx],
          questionsAnswered: true,
          questionsAnswers: answers,
        };
        useDiscoveryStore.getState().setMessages(updated);
      }

      // Send silently (no user bubble) and process the agent's response
      setIsStreaming(true);
      try {
        const res = await fetch(
          `/api/v1/sessions/${activeSessionId}/message`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, answers }),
          }
        );

        await processDiscoveryStream(res);
        setIsStreaming(false);
      } catch (error) {
        console.error("Question answer submission error:", error);
        addMessage({
          role: "assistant",
          content: tPipeline("connectionError"),
          type: "stage-update",
        });
        setIsStreaming(false);
      }
    },
    [sessionId, addMessage, setIsStreaming, processDiscoveryStream, tPipeline]
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
    submitQuestionAnswers,
    reset,
  };
}
