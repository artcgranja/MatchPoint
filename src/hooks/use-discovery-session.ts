"use client";

import { useCallback } from "react";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useSearchStore } from "@/stores/search-store";
import { apiPost, apiGet } from "@/lib/api/client";
import type { DiscoverySession, SessionStage, StartupCard } from "@/types";

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
        if (!res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              const eventType = line.slice(7).trim();
              // Next line should be data
              const dataLine = lines[lines.indexOf(line) + 1];
              if (dataLine?.startsWith("data: ")) {
                try {
                  const data = JSON.parse(dataLine.slice(6));

                  if (eventType === "stage_update" || eventType === "stage_complete") {
                    // Update stage in chat
                    const stageMap: Record<string, SessionStage> = {
                      Analysis: "analysis",
                      Scout: "scout",
                    };
                    const stage = stageMap[data.agentName];
                    if (stage && eventType === "stage_update" && data.progress === 0) {
                      setCurrentStage(stage);
                      addMessage({
                        role: "assistant",
                        content: data.message,
                        type: "stage-update",
                      });
                    }
                  }

                  if (eventType === "pipeline_complete") {
                    const cards = (data.cards ?? []) as StartupCard[];
                    const summary = (data.summary ?? "") as string;

                    if (cards.length > 0) {
                      addMessage({
                        role: "assistant",
                        content: summary,
                        type: "cards",
                        cards,
                      });
                    }

                    setCurrentStage("complete");
                    setDiscoveryState("complete");
                    completePipeline();
                  }

                  if (eventType === "error") {
                    addMessage({
                      role: "assistant",
                      content: `Erro no pipeline: ${data.message}`,
                      type: "stage-update",
                    });
                    errorPipeline();
                  }
                } catch {
                  // Skip malformed data
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Pipeline stream error:", error);
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
