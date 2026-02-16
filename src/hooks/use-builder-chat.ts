"use client";

import { useCallback, useRef, useEffect } from "react";
import { useBuilderStore } from "@/stores/builder-store";
import { createSseParser } from "@/lib/sse/parser";

export function useBuilderChat(projectId: string) {
  const addChatMessage = useBuilderStore((s) => s.addChatMessage);
  const updateLastAssistantMessage = useBuilderStore(
    (s) => s.updateLastAssistantMessage
  );
  const setIsStreaming = useBuilderStore((s) => s.setIsStreaming);
  const setStreamingMessageId = useBuilderStore(
    (s) => s.setStreamingMessageId
  );
  const setFileTree = useBuilderStore((s) => s.setFileTree);
  const setPreviewUrl = useBuilderStore((s) => s.setPreviewUrl);

  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);
  const fileTreeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const fileTreeRequestRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      streamingRef.current = false;
      setIsStreaming(false);
      setStreamingMessageId(null);
      if (fileTreeDebounceRef.current)
        clearTimeout(fileTreeDebounceRef.current);
    };
  }, [setIsStreaming, setStreamingMessageId]);

  const refreshFileTree = useCallback(() => {
    if (fileTreeDebounceRef.current)
      clearTimeout(fileTreeDebounceRef.current);

    fileTreeDebounceRef.current = setTimeout(() => {
      const requestId = ++fileTreeRequestRef.current;
      fetch(
        `/api/v1/builder/projects/${projectId}/files?path=/home/user/app`
      )
        .then((r) => {
          if (!r.ok) throw new Error("Failed to fetch");
          return r.json();
        })
        .then((data) => {
          // Discard stale responses
          if (fileTreeRequestRef.current === requestId) {
            setFileTree(data);
          }
        })
        .catch(() => {});
    }, 500);
  }, [projectId, setFileTree]);

  const processStream = useCallback(
    async (res: Response) => {
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const sseParser = createSseParser();

      let assistantMsg = "";
      let textRafId: number | null = null;

      // Create a streaming message entry
      const msgId = crypto.randomUUID();
      addChatMessage({ id: msgId, role: "assistant", content: "" });
      setStreamingMessageId(msgId);

      const flushText = () => {
        updateLastAssistantMessage(assistantMsg);
        textRafId = null;
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const events = sseParser.feed(chunk);

          for (const sse of events) {
            try {
              const payload = JSON.parse(sse.data);
              const eventType = sse.event;

              switch (eventType) {
                case "text": {
                  assistantMsg += payload.text ?? "";
                  if (textRafId === null) {
                    textRafId = requestAnimationFrame(flushText);
                  }
                  break;
                }

                case "thinking": {
                  addChatMessage({
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: payload.text ?? "",
                    type: "thinking",
                  });
                  break;
                }

                case "tool_start": {
                  // Finalize pending text
                  if (assistantMsg) {
                    if (textRafId !== null) {
                      cancelAnimationFrame(textRafId);
                      textRafId = null;
                    }
                    updateLastAssistantMessage(assistantMsg);
                    assistantMsg = "";
                  }
                  // Reset streaming message for next text block
                  setStreamingMessageId(null);

                  addChatMessage({
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: `Running ${payload.tool}...`,
                    type: "tool_call",
                    metadata: { tool: payload.tool, id: payload.id },
                  });
                  break;
                }

                case "tool_result": {
                  const output = payload.output ?? "";
                  if (output && output.length < 500) {
                    addChatMessage({
                      id: crypto.randomUUID(),
                      role: "assistant",
                      content: output,
                      type: "command_output",
                    });
                  }
                  // Prepare new streaming message for next text block
                  const newMsgId = crypto.randomUUID();
                  addChatMessage({
                    id: newMsgId,
                    role: "assistant",
                    content: "",
                  });
                  setStreamingMessageId(newMsgId);
                  assistantMsg = "";
                  break;
                }

                case "file_changed": {
                  addChatMessage({
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: `${payload.action}: ${payload.path}`,
                    type: "file_change",
                  });
                  refreshFileTree();
                  break;
                }

                case "command_output": {
                  addChatMessage({
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: payload.output ?? "",
                    type: "command_output",
                  });
                  break;
                }

                case "preview_ready": {
                  setPreviewUrl(payload.url);
                  break;
                }

                case "done": {
                  break;
                }

                case "error": {
                  addChatMessage({
                    id: crypto.randomUUID(),
                    role: "system",
                    content: `Error: ${payload.message}`,
                  });
                  break;
                }
              }
            } catch (err) {
              if (!(err instanceof SyntaxError)) {
                console.error("Error processing SSE event:", err);
              }
            }
          }
        }
      } finally {
        // Final flush
        if (textRafId !== null) cancelAnimationFrame(textRafId);
        if (assistantMsg) updateLastAssistantMessage(assistantMsg);
        setStreamingMessageId(null);

        // Remove trailing empty assistant messages
        const msgs = useBuilderStore.getState().chatMessages;
        const cleaned = msgs.filter(
          (m) =>
            !(
              m.role === "assistant" &&
              (!m.type || m.type === "text") &&
              !m.content.trim()
            )
        );
        if (cleaned.length !== msgs.length) {
          useBuilderStore.getState().setChatMessages(cleaned);
        }
      }
    },
    [
      addChatMessage,
      updateLastAssistantMessage,
      setStreamingMessageId,
      setFileTree,
      setPreviewUrl,
      refreshFileTree,
    ]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      // Guard against concurrent sends
      if (streamingRef.current) return;
      streamingRef.current = true;

      addChatMessage({ id: crypto.randomUUID(), role: "user", content: text });
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      // 5-minute timeout for long agent operations
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      try {
        const res = await fetch(
          `/api/v1/builder/projects/${projectId}/message`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          addChatMessage({
            id: crypto.randomUUID(),
            role: "system",
            content: errBody.error || `Request failed (${res.status})`,
          });
          return;
        }

        await processStream(res);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          addChatMessage({
            id: crypto.randomUUID(),
            role: "system",
            content: "Request was cancelled.",
          });
        } else {
          console.error("Builder chat error:", error);
          addChatMessage({
            id: crypto.randomUUID(),
            role: "system",
            content: "Connection error. Please try again.",
          });
        }
      } finally {
        clearTimeout(timeoutId);
        abortRef.current = null;
        streamingRef.current = false;
        setIsStreaming(false);
      }
    },
    [projectId, addChatMessage, setIsStreaming, processStream]
  );

  return { sendMessage };
}
