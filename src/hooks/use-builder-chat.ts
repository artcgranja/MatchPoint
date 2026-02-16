"use client";

import { useCallback } from "react";
import { useBuilderStore } from "@/stores/builder-store";
import { createSseParser } from "@/lib/sse/parser";

export function useBuilderChat(projectId: string) {
  const addChatMessage = useBuilderStore((s) => s.addChatMessage);
  const updateLastAssistantMessage = useBuilderStore(
    (s) => s.updateLastAssistantMessage
  );
  const setIsStreaming = useBuilderStore((s) => s.setIsStreaming);
  const setFileTree = useBuilderStore((s) => s.setFileTree);
  const setPreviewUrl = useBuilderStore((s) => s.setPreviewUrl);

  const processStream = useCallback(
    async (res: Response) => {
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const sseParser = createSseParser();

      let assistantMsg = "";
      let textRafId: number | null = null;

      const flushText = () => {
        updateLastAssistantMessage(assistantMsg);
        textRafId = null;
      };

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

                addChatMessage({
                  role: "assistant",
                  content: `Running ${payload.tool}...`,
                  type: "tool_call",
                  metadata: { tool: payload.tool, id: payload.id },
                });
                break;
              }

              case "tool_result": {
                // Update tool call message to show result
                const output = payload.output ?? "";
                if (output && output.length < 500) {
                  addChatMessage({
                    role: "assistant",
                    content: output,
                    type: "command_output",
                  });
                }
                break;
              }

              case "file_changed": {
                addChatMessage({
                  role: "assistant",
                  content: `${payload.action}: ${payload.path}`,
                  type: "file_change",
                });

                // Refresh file tree
                fetch(
                  `/api/v1/builder/projects/${projectId}/files?path=/home/user/app`
                )
                  .then((r) => r.json())
                  .then(setFileTree)
                  .catch(() => {});
                break;
              }

              case "command_output": {
                addChatMessage({
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
                // Finalize
                break;
              }

              case "error": {
                addChatMessage({
                  role: "system",
                  content: `Error: ${payload.message}`,
                });
                break;
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      // Final flush
      if (textRafId !== null) cancelAnimationFrame(textRafId);
      if (assistantMsg) updateLastAssistantMessage(assistantMsg);
    },
    [
      addChatMessage,
      updateLastAssistantMessage,
      setFileTree,
      setPreviewUrl,
      projectId,
    ]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      addChatMessage({ role: "user", content: text });
      setIsStreaming(true);

      try {
        const res = await fetch(
          `/api/v1/builder/projects/${projectId}/message`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text }),
          }
        );

        await processStream(res);
      } catch (error) {
        console.error("Builder chat error:", error);
        addChatMessage({
          role: "system",
          content: "Connection error. Please try again.",
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [projectId, addChatMessage, setIsStreaming, processStream]
  );

  return { sendMessage };
}
