"use client";

import { useCallback } from "react";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useSearchStore } from "@/stores/search-store";
import { apiPost, apiGet } from "@/lib/api/client";
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
    reset,
  } = useDiscoveryStore();

  const { setSearchId, startPipeline, completePipeline, errorPipeline } =
    useSearchStore();

  const initSession = useCallback(async () => {
    const { id } = await apiPost<{
      id: string;
      currentPhase: string;
    }>("/discovery");
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

  const runPipelineStream = useCallback(
    async (searchId: string) => {
      startPipeline();

      try {
        const res = await fetch(`/api/v1/searches/${searchId}/stream`);
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
          const events = parser.feed(chunk);

          for (const sse of events) {
            try {
              const data = JSON.parse(sse.data);

              if (sse.event === "stage_update" || sse.event === "stage_complete") {
                const stageMap: Record<string, SessionStage> = {
                  Analysis: "analysis",
                  Scout: "scout",
                };
                const stage = stageMap[data.agentName];
                if (stage && sse.event === "stage_update" && data.progress === 0) {
                  setCurrentStage(stage);
                  addMessage({
                    role: "assistant",
                    content: data.message,
                    type: "stage-update",
                  });
                }
              }

              if (sse.event === "pipeline_complete") {
                // cards and summary live inside data.data (nested)
                const payload = data.data as
                  | { cards?: StartupCard[]; summary?: string }
                  | undefined;
                const cards = payload?.cards ?? [];
                const summary = payload?.summary ?? "";

                if (cards.length > 0) {
                  addMessage({
                    role: "assistant",
                    content: summary,
                    type: "cards",
                    cards,
                  });
                } else {
                  // No startups found — show the summary as a regular message
                  addMessage({
                    role: "assistant",
                    content:
                      summary ||
                      "Nenhuma startup encontrada para os criterios definidos. Tente ajustar sua busca.",
                  });
                }

                setCurrentStage("complete");
                setDiscoveryState("complete");
                completePipeline();
              }

              if (sse.event === "error") {
                addMessage({
                  role: "assistant",
                  content: `Erro no pipeline: ${data.message}`,
                  type: "stage-update",
                });
                setCurrentStage("complete");
                setDiscoveryState("complete");
                errorPipeline();
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch (error) {
        console.error("Pipeline stream error:", error);
        addMessage({
          role: "assistant",
          content: "Erro de conexao com o pipeline. Tente novamente.",
          type: "stage-update",
        });
        setCurrentStage("complete");
        setDiscoveryState("complete");
        errorPipeline();
      }
    },
    [startPipeline, completePipeline, errorPipeline, setCurrentStage, setDiscoveryState, addMessage]
  );

  const sendMessage = useCallback(
    async (text: string, sid?: string) => {
      const activeSessionId = sid ?? sessionId;
      if (!activeSessionId) return;

      addMessage({ role: "user", content: text });
      setIsStreaming(true);

      try {
        const res = await fetch(
          `/api/v1/discovery/${activeSessionId}/message`,
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
        let assistantMsg = "";
        let discoveryDone = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  assistantMsg += data.text;
                  updateLastAssistantMessage(assistantMsg);
                }
                if (data.done) {
                  discoveryDone = true;
                }
                if (data.error) {
                  console.error("Discovery SSE error:", data.error);
                }
              } catch {
                // Skip malformed SSE data lines
              }
            }
          }
        }

        setIsStreaming(false);

        // If discovery is complete, trigger the pipeline
        if (discoveryDone) {
          setDiscoveryState("processing");
          setCurrentStage("analysis");

          addMessage({
            role: "assistant",
            content: "Discovery concluida! Analisando suas necessidades...",
            type: "stage-update",
          });

          try {
            const { id } = await apiPost<{ id: string }>("/searches", {
              discoverySessionId: activeSessionId,
            });
            setSearchId(id);
            await runPipelineStream(id);
          } catch (error) {
            console.error("Failed to create search from discovery:", error);
            addMessage({
              role: "assistant",
              content: "Erro ao iniciar busca. Tente novamente.",
              type: "stage-update",
            });
            setDiscoveryState("complete");
            setCurrentStage("complete");
          }
        }
      } catch (error) {
        console.error("Discovery session error:", error);
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
      runPipelineStream,
    ]
  );

  return {
    sessionId,
    discoveryState,
    currentStage,
    messages,
    isStreaming,
    initSession,
    loadSession,
    sendMessage,
    reset,
  };
}
