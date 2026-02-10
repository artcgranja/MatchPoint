"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./chat-message";
import type { DiscoveryMessage } from "@/types";

interface ChatMessageListProps {
  messages: DiscoveryMessage[];
  isStreaming: boolean;
}

export function ChatMessageList({
  messages,
  isStreaming,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Track if user has scrolled away from bottom
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setUserScrolledUp(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll when new messages arrive (unless user scrolled up)
  useEffect(() => {
    if (!userScrolledUp) {
      scrollToBottom();
    }
  }, [messages, userScrolledUp, scrollToBottom]);

  if (messages.length === 0 && isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-foreground-muted">
          <div className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-highlight [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-highlight [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-highlight [animation-delay:300ms]" />
          </div>
          <span className="text-sm">Navigator is thinking...</span>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-1">
      <div className="space-y-4 py-4">
        {messages.map((message, index) => {
          const isLast =
            index === messages.length - 1 && message.role === "assistant";
          return (
            <ChatMessage
              key={message.id ?? index}
              message={message}
              isStreaming={isStreaming && isLast}
            />
          );
        })}
        <div ref={sentinelRef} />
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
