"use client";

import { useState, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useDiscoverySession(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [phase, setPhase] = useState("situation");
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setIsStreaming(true);

      try {
        const res = await fetch(`/api/v1/discovery/${sessionId}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });

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
                  setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last?.role === "assistant") {
                      return [
                        ...prev.slice(0, -1),
                        { role: "assistant" as const, content: assistantMsg },
                      ];
                    }
                    return [
                      ...prev,
                      { role: "assistant" as const, content: assistantMsg },
                    ];
                  });
                }
                if (data.phase) {
                  setPhase(data.phase);
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
    [sessionId]
  );

  return { messages, phase, isStreaming, sendMessage };
}
