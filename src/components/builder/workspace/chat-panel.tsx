"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { ArrowUp, Loader2, Wrench, FileCode2, MessageSquare } from "lucide-react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { cn } from "@/lib/utils";
import { slideUp } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/stores/builder-store";
import { useBuilderChat } from "@/hooks/use-builder-chat";
import type { BuilderChatMessage } from "@/types/builder";

interface ChatPanelProps {
  projectId: string;
}

function ChatMessage({ message, isLast, isStreaming }: { message: BuilderChatMessage; isLast: boolean; isStreaming: boolean }) {
  const streaming = isLast && isStreaming;

  if (message.role === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-foreground-muted">{message.content}</span>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <motion.div variants={slideUp} initial="hidden" animate="visible" className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-highlight px-4 py-2.5 text-sm leading-relaxed text-highlight-foreground">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  // Assistant messages by type
  if (message.type === "thinking") {
    return (
      <motion.div variants={slideUp} initial="hidden" animate="visible" className="flex items-start gap-2 text-xs text-foreground-muted italic py-1">
        <Loader2 className="mt-0.5 h-3 w-3 animate-spin shrink-0" />
        <span className="leading-relaxed">{message.content}</span>
      </motion.div>
    );
  }

  if (message.type === "tool_call") {
    return (
      <motion.div variants={slideUp} initial="hidden" animate="visible" className="flex items-center gap-1.5 py-1">
        <Wrench className="h-3 w-3 text-foreground-muted animate-pulse" />
        <span className="text-xs text-foreground-muted">{message.metadata?.tool as string ?? "Running tool..."}</span>
      </motion.div>
    );
  }

  if (message.type === "file_change") {
    return (
      <motion.div variants={slideUp} initial="hidden" animate="visible" className="flex items-center gap-1.5 rounded-lg bg-green-500/5 border border-green-500/20 px-3 py-1.5">
        <FileCode2 className="h-3 w-3 text-green-400 shrink-0" />
        <span className="text-xs text-green-400">{message.content}</span>
      </motion.div>
    );
  }

  if (message.type === "command_output") {
    return (
      <motion.div variants={slideUp} initial="hidden" animate="visible">
        <pre className="overflow-x-auto rounded-lg bg-[#0a0a0f] p-2.5 text-xs text-foreground-muted font-mono leading-relaxed">
          {message.content}
        </pre>
      </motion.div>
    );
  }

  // Default: assistant text with markdown
  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      className={cn(
        "prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-li:text-foreground/90 prose-strong:text-foreground prose-code:text-highlight prose-pre:bg-[#0a0a0f] dark:prose-invert",
        streaming && "[&_.sd-caret]:inline-block"
      )}
    >
      <Streamdown
        plugins={{ code }}
        isAnimating={!!streaming}
        caret={streaming ? "block" : undefined}
      >
        {message.content}
      </Streamdown>
    </motion.div>
  );
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const chatMessages = useBuilderStore((s) => s.chatMessages);
  const chatOpen = useBuilderStore((s) => s.chatOpen);
  const isStreaming = useBuilderStore((s) => s.isStreaming);
  const { sendMessage } = useBuilderChat(projectId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    await sendMessage(text);
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  // Collapsed state — show vertical icon strip
  if (!chatOpen) {
    return (
      <div className="flex h-full flex-col items-center py-3 bg-background">
        <MessageSquare className="h-4 w-4 text-foreground-muted" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center border-b border-border px-3 py-1.5">
        <MessageSquare className="mr-1.5 h-3.5 w-3.5 text-highlight" />
        <span className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
          Chat
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-foreground-muted">
            <p className="text-sm">Describe what you want to build.</p>
            <p className="text-xs text-foreground-muted/60">The AI will write code, create files, and run commands.</p>
          </div>
        )}
        {chatMessages.map((msg, i) => (
          <ChatMessage
            key={msg.id ?? i}
            message={msg}
            isLast={i === chatMessages.length - 1}
            isStreaming={isStreaming}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="relative rounded-2xl border border-border bg-background-secondary/40 shadow-sm focus-within:border-highlight/30 focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.1)]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what to build..."
            rows={1}
            className="w-full resize-none bg-transparent px-4 pb-10 pt-3 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none disabled:opacity-50"
            disabled={isStreaming}
          />
          <div className="absolute right-3 bottom-2.5">
            <Button
              onClick={() => void handleSubmit()}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="h-7 w-7 rounded-lg"
              aria-label={isStreaming ? "Generating response" : "Send message"}
            >
              {isStreaming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
