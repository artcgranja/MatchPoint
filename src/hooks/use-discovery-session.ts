"use client";

import { useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useSearchStore } from "@/stores/search-store";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { apiGet, apiPost } from "@/lib/api/client";
import { createSseParser } from "@/lib/sse/parser";
import { useQuestionWizardStore } from "@/stores/question-wizard-store";
import type { BizDevPlanStatus, DiscoveryMessage, DiscoverySession, QuestionAnswer, QuestionData, StartupCard } from "@/types";

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
            if (session.currentStage === "awaiting_confirmation") {
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

        // Show recovery action if pipeline was interrupted
        if (session.recoveryAction === "retry_analysis") {
          msgs.push({
            role: "assistant",
            content: tPipeline("analysisInterrupted"),
            type: "action",
            actionType: "retry_analysis",
            actionLabel: tPipeline("retryAnalysis"),
          });
          useAgentPanelStore.getState().batchUpdate({
            panelOpen: true,
            activeTab: "analysis",
          });
        } else if (session.recoveryAction === "retry_scout") {
          msgs.push({
            role: "assistant",
            content: tPipeline("scoutInterrupted"),
            type: "action",
            actionType: "retry_scout",
            actionLabel: tPipeline("retryScout"),
          });
          if (search?.productDocument) {
            useAgentPanelStore.getState().batchUpdate({
              planText: search.productDocument,
              analysisStatus: "confirmed",
              panelOpen: true,
              activeTab: "scout",
            });
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
        if (session.recoveryAction) {
          setDiscoveryState("chatting"); // Don't disable chat — action buttons handle recovery
        } else if (session.currentStage === "awaiting_confirmation") {
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
  // Unified SSE stream processor — handles ALL event types from all agents
  // ═══════════════════════════════════════════
  const processStream = useCallback(
    async (res: Response) => {
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const sseParser = createSseParser();

      // Text accumulation for discovery/advisor streaming
      let assistantMsg = "";
      let textFinalized = false;
      let textRafId: number | null = null;
      const flushText = () => {
        if (textFinalized) return;
        updateLastAssistantMessage(assistantMsg);
        textRafId = null;
      };

      // Analysis accumulation (batched)
      let thinkingAccum = "";
      let planAccum = "";
      let analysisStatus: BizDevPlanStatus | null = null;
      let analysisPanelOpened = false;

      const flushAnalysisBatch = () => {
        const batch: Record<string, unknown> = {};
        if (!analysisPanelOpened) {
          batch.panelOpen = true;
          batch.activeTab = "analysis";
          analysisPanelOpened = true;
        }
        if (analysisStatus) {
          batch.analysisStatus = analysisStatus;
          analysisStatus = null;
        }
        if (thinkingAccum) {
          const store = useAgentPanelStore.getState();
          batch.thinkingText = store.thinkingText + thinkingAccum;
          thinkingAccum = "";
        }
        if (planAccum) {
          const store = useAgentPanelStore.getState();
          batch.planText = store.planText + planAccum;
          planAccum = "";
        }
        if (Object.keys(batch).length > 0) {
          useAgentPanelStore.getState().batchUpdate(batch);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const events = sseParser.feed(chunk);

        // Track whether we need to flush analysis batch
        let hasAnalysisEvents = false;

        for (const sse of events) {
          try {
            const payload = JSON.parse(sse.data);
            const eventType = sse.event;

            switch (eventType) {
              case "text": {
                if (payload.agent === "analysis") {
                  // Analysis text → agent panel
                  planAccum += payload.text ?? "";
                  analysisStatus = "writing";
                  hasAnalysisEvents = true;
                } else {
                  // Discovery/advisor text → chat bubble
                  assistantMsg += payload.text ?? "";
                  if (textRafId === null) {
                    textRafId = requestAnimationFrame(flushText);
                  }
                }
                break;
              }

              case "thinking": {
                // Analysis thinking → agent panel
                thinkingAccum += payload.text ?? "";
                analysisStatus = "thinking";
                hasAnalysisEvents = true;
                break;
              }

              case "tool_start": {
                // Finalize pending text before showing tool status
                if (!textFinalized && assistantMsg) {
                  if (textRafId !== null) {
                    cancelAnimationFrame(textRafId);
                    textRafId = null;
                  }
                  updateLastAssistantMessage(assistantMsg);
                  textFinalized = true;
                }

                // Show tool-specific loading message in chat for discovery tools
                if (payload.agent === "discovery") {
                  const toolMsgKeys: Record<string, string> = {
                    ask_questions: "generatingQuestionnaire",
                    complete_discovery: "finalizingDiscovery",
                  };
                  const msgKey = toolMsgKeys[payload.toolName];
                  if (msgKey) {
                    addMessage({
                      role: "assistant",
                      content: tPipeline(msgKey as Parameters<typeof tPipeline>[0]),
                      type: "stage-update",
                    });
                  }
                }

                // Add to agent panel tool calls early (status: running)
                const store = useAgentPanelStore.getState();
                useAgentPanelStore.getState().batchUpdate({
                  toolCalls: [...store.toolCalls, {
                    id: payload.toolCallId ?? crypto.randomUUID(),
                    toolName: payload.toolName ?? "unknown",
                    input: {},
                    status: "running" as const,
                    timestamp: Date.now(),
                  }],
                });
                break;
              }

              case "tool_call": {
                // Update existing tool call with input (added on tool_start)
                const tcId = payload.toolCallId;
                if (tcId) {
                  const tcStore = useAgentPanelStore.getState();
                  const exists = tcStore.toolCalls.some((tc) => tc.id === tcId);
                  if (exists) {
                    useAgentPanelStore.getState().batchUpdate({
                      toolCalls: tcStore.toolCalls.map((tc) =>
                        tc.id === tcId ? { ...tc, input: payload.input ?? {} } : tc
                      ),
                    });
                  } else {
                    // Fallback: add if tool_start was missed
                    useAgentPanelStore.getState().batchUpdate({
                      toolCalls: [...tcStore.toolCalls, {
                        id: tcId,
                        toolName: payload.toolName ?? "unknown",
                        input: payload.input ?? {},
                        status: "running" as const,
                        timestamp: Date.now(),
                      }],
                    });
                  }
                }
                break;
              }

              case "tool_result": {
                // Update tool call status
                const toolCallId = payload.toolCallId;
                if (toolCallId) {
                  const store = useAgentPanelStore.getState();
                  useAgentPanelStore.getState().batchUpdate({
                    toolCalls: store.toolCalls.map((tc) =>
                      tc.id === toolCallId
                        ? { ...tc, status: "complete" as const, resultSummary: payload.resultSummary }
                        : tc
                    ),
                  });
                }
                break;
              }

              case "questions": {
                // Finalize any pending text first
                if (!textFinalized && assistantMsg) {
                  if (textRafId !== null) {
                    cancelAnimationFrame(textRafId);
                    textRafId = null;
                  }
                  updateLastAssistantMessage(assistantMsg);
                  textFinalized = true;
                }

                // Open wizard
                useQuestionWizardStore.getState().openWizard(
                  payload.questions as QuestionData[],
                  payload.context
                );

                // Track questions message in chat
                addMessage({
                  role: "assistant",
                  content: "",
                  type: "questions",
                  questions: payload.questions as DiscoveryMessage["questions"],
                  questionsContext: payload.context,
                });
                break;
              }

              case "stage_update": {
                const agent = payload.agent as string;
                const resolvedMessage = payload.key
                  ? tPipeline(payload.key as Parameters<typeof tPipeline>[0], payload.params ?? {})
                  : (payload.message ?? "");

                if (agent === "scout") {
                  if (payload.progress === 0) {
                    setCurrentStage("scout");
                    useAgentPanelStore.getState().batchUpdate({
                      activeTab: "scout",
                      panelOpen: true,
                      scoutStatus: "searching",
                      scoutProgress: payload.progress,
                      scoutMessage: resolvedMessage,
                    });
                  } else {
                    useAgentPanelStore.getState().batchUpdate({
                      scoutProgress: payload.progress,
                      scoutMessage: resolvedMessage,
                    });
                  }
                } else if (agent === "analysis") {
                  // Analysis stage update (preparing)
                  hasAnalysisEvents = true;
                }
                break;
              }

              case "pipeline_complete": {
                const data = payload.data as { cards?: StartupCard[]; summary?: string } | undefined;
                const cards = (data?.cards ?? []) as StartupCard[];
                const summary = data?.summary ?? "";

                useAgentPanelStore.getState().batchUpdate({
                  cards,
                  scoutSummary: summary,
                  scoutStatus: "complete",
                  scoutProgress: 100,
                  scoutMessage: tPipeline("searchComplete"),
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
                    content: summary || tPipeline("noStartupsFound"),
                  });
                }

                setCurrentStage("advising");
                setDiscoveryState("advising");
                completePipeline();
                break;
              }

              case "done": {
                if (payload.agent === "analysis") {
                  // Analysis complete — flush any remaining batch
                  analysisStatus = "complete";
                  flushAnalysisBatch();
                }
                if (payload.transition === "awaiting_confirmation" && payload.searchId) {
                  setDiscoveryState("processing");
                  setCurrentStage("analysis");
                  setSearchId(payload.searchId);
                  startPipeline();
                }
                break;
              }

              case "status": {
                // Finalize any pending text first
                if (!textFinalized && assistantMsg) {
                  if (textRafId !== null) {
                    cancelAnimationFrame(textRafId);
                    textRafId = null;
                  }
                  updateLastAssistantMessage(assistantMsg);
                  textFinalized = true;
                }
                const statusContent = payload.key
                  ? tPipeline(payload.key as Parameters<typeof tPipeline>[0], payload.params ?? {})
                  : payload.message;
                addMessage({
                  role: "assistant",
                  content: statusContent,
                  type: "stage-update",
                });
                break;
              }

              case "error": {
                // Finalize any pending text first
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
                  content: tPipeline("error", { message: payload.message }),
                  type: "stage-update",
                });

                // Set scout error if during scout phase
                if (payload.agent === "system" || payload.agent === "scout") {
                  useAgentPanelStore.getState().batchUpdate({ scoutStatus: "error" });
                  setCurrentStage("complete");
                  setDiscoveryState("complete");
                }
                errorPipeline();
                break;
              }
            }
          } catch (err) {
            console.warn("[SSE] Malformed event:", err);
          }
        }

        // Flush analysis batch if we had any analysis events in this chunk
        if (hasAnalysisEvents) {
          flushAnalysisBatch();
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
      completePipeline,
      errorPipeline,
      tPipeline,
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

      await processStream(res);
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
    processStream,
    tPipeline,
  ]);

  // ═══════════════════════════════════════════
  // Recovery: Retry interrupted analysis
  // ═══════════════════════════════════════════
  const retryAnalysis = useCallback(async () => {
    const sid = sessionId ?? useDiscoveryStore.getState().sessionId;
    if (!sid) return;

    // Remove the action message from chat
    const msgs = useDiscoveryStore.getState().messages.filter(m => m.type !== "action");
    setMessages(msgs);

    setIsStreaming(true);
    setCurrentStage("analysis");
    addMessage({
      role: "assistant",
      content: tPipeline("preparingAnalysis"),
      type: "stage-update",
    });

    try {
      const res = await fetch(`/api/v1/sessions/${sid}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "[Retry Analysis]" }),
      });

      if (!res.body) {
        errorPipeline();
        setIsStreaming(false);
        return;
      }

      await processStream(res);
      setIsStreaming(false);
    } catch (error) {
      console.error("Retry analysis error:", error);
      addMessage({
        role: "assistant",
        content: tPipeline("pipelineConnectionError"),
        type: "stage-update",
      });
      setIsStreaming(false);
      errorPipeline();
    }
  }, [
    sessionId,
    setMessages,
    setIsStreaming,
    setCurrentStage,
    addMessage,
    processStream,
    errorPipeline,
    tPipeline,
  ]);

  // ═══════════════════════════════════════════
  // Recovery: Retry interrupted scout
  // ═══════════════════════════════════════════
  const retryScout = useCallback(async () => {
    const sid = sessionId ?? useDiscoveryStore.getState().sessionId;
    const searchIdVal = searchId ?? useSearchStore.getState().searchId;
    if (!sid || !searchIdVal) return;

    // Remove the action message from chat
    const msgs = useDiscoveryStore.getState().messages.filter(m => m.type !== "action");
    setMessages(msgs);

    setCurrentStage("scout");
    useAgentPanelStore.getState().batchUpdate({
      activeTab: "scout",
      scoutStatus: "searching",
      scoutProgress: 0,
      scoutMessage: tPipeline("startingSearch"),
    });
    addMessage({
      role: "assistant",
      content: tPipeline("planConfirmed"),
      type: "stage-update",
    });

    try {
      const res = await fetch(`/api/v1/sessions/${sid}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "[Retry Scout]" }),
      });

      if (!res.body) {
        errorPipeline();
        return;
      }

      await processStream(res);
    } catch (error) {
      console.error("Retry scout error:", error);
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
    setMessages,
    setCurrentStage,
    setDiscoveryState,
    addMessage,
    processStream,
    errorPipeline,
    tPipeline,
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

        await processStream(res);
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
      processStream,
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

        await processStream(res);
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
    [sessionId, addMessage, setIsStreaming, processStream, tPipeline]
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
    retryAnalysis,
    retryScout,
    submitQuestionAnswers,
    reset,
  };
}
