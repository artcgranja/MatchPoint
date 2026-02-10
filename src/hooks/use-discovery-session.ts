"use client";

import { useCallback } from "react";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { apiPost, apiGet } from "@/lib/api/client";
import type { DiscoverySession, ScopePhase } from "@/types";

export function useDiscoverySession() {
  const {
    sessionId,
    discoveryState,
    currentPhase,
    messages,
    isComplete,
    isStreaming,
    setSessionId,
    setDiscoveryState,
    setCurrentPhase,
    addMessage,
    updateLastAssistantMessage,
    setComplete,
    setIsStreaming,
    setMessages,
    reset,
  } = useDiscoveryStore();

  const initSession = useCallback(async () => {
    const { id, currentPhase: phase } = await apiPost<{
      id: string;
      currentPhase: ScopePhase;
    }>("/discovery");
    setSessionId(id);
    setCurrentPhase(phase);
    setDiscoveryState("chatting");
    return id;
  }, [setSessionId, setCurrentPhase, setDiscoveryState]);

  const loadSession = useCallback(
    async (id: string) => {
      const session = await apiGet<DiscoverySession>(`/discovery/${id}`);
      setSessionId(session.id);
      setCurrentPhase(session.currentPhase);
      setComplete(session.isComplete);
      setMessages(
        session.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          phase: m.phase,
          createdAt: m.createdAt,
        }))
      );
      if (session.isComplete) {
        setDiscoveryState("completing");
      } else if (session.messages.length > 0) {
        setDiscoveryState("chatting");
      } else {
        setDiscoveryState("idle");
      }
      return session;
    },
    [setSessionId, setCurrentPhase, setComplete, setMessages, setDiscoveryState]
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
                if (data.phase) {
                  setCurrentPhase(data.phase as ScopePhase);
                  if (data.phase === "complete") {
                    setComplete(true);
                    setDiscoveryState("completing");
                  }
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
      } catch (error) {
        console.error("Discovery session error:", error);
      } finally {
        setIsStreaming(false);
      }
    },
    [
      sessionId,
      addMessage,
      updateLastAssistantMessage,
      setIsStreaming,
      setCurrentPhase,
      setComplete,
      setDiscoveryState,
    ]
  );

  return {
    sessionId,
    discoveryState,
    currentPhase,
    messages,
    isComplete,
    isStreaming,
    initSession,
    loadSession,
    sendMessage,
    reset,
    setDiscoveryState,
  };
}
