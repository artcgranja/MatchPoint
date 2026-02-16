"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/stores/builder-store";
import { useBuilderChat } from "@/hooks/use-builder-chat";

interface ChatPanelProps {
  projectId: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const chatMessages = useBuilderStore((s) => s.chatMessages);
  const isStreaming = useBuilderStore((s) => s.isStreaming);
  const { sendMessage } = useBuilderChat(projectId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    await sendMessage(text);
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border px-3 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
          Chat
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.length === 0 && (
          <p className="py-8 text-center text-xs text-foreground-muted">
            Describe what you want to build and the AI will create it.
          </p>
        )}
        {chatMessages.map((msg, i) => (
          <div
            key={msg.id ?? i}
            className={cn(
              "text-sm",
              msg.role === "user" && "text-right",
              msg.role === "system" && "text-center text-xs text-foreground-muted"
            )}
          >
            {msg.role === "user" ? (
              <div className="inline-block max-w-[85%] rounded-lg bg-highlight/10 px-3 py-2 text-left text-foreground">
                {msg.content}
              </div>
            ) : msg.type === "thinking" ? (
              <div className="rounded-lg border border-border/50 bg-background-secondary/30 px-3 py-2 text-xs text-foreground-muted italic">
                {msg.content}
              </div>
            ) : msg.type === "tool_call" ? (
              <div className="flex items-center gap-1.5 rounded-lg bg-background-secondary/30 px-3 py-1.5 text-xs text-foreground-muted">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{msg.metadata?.tool as string ?? "Running tool..."}</span>
              </div>
            ) : msg.type === "file_change" ? (
              <div className="rounded-lg bg-green-500/5 border border-green-500/20 px-3 py-1.5 text-xs text-green-400">
                {msg.content}
              </div>
            ) : msg.type === "command_output" ? (
              <pre className="overflow-x-auto rounded-lg bg-[#0a0a0f] p-2 text-xs text-foreground-muted font-mono">
                {msg.content}
              </pre>
            ) : (
              <div className="max-w-[85%] rounded-lg bg-background-secondary/50 px-3 py-2 text-foreground whitespace-pre-wrap">
                {msg.content}
              </div>
            )}
          </div>
        ))}
        {isStreaming && (
          <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-2">
        <div className="flex items-end gap-2 rounded-lg border border-border bg-background-secondary/30 p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what to build..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none"
            disabled={isStreaming}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming}
            className={cn(
              "shrink-0 rounded-md p-1.5 transition-colors",
              input.trim() && !isStreaming
                ? "text-highlight hover:bg-highlight/10"
                : "text-foreground-muted/30"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
