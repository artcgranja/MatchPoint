"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "motion/react";
import { ArrowUp, Bot, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConnectionsStore } from "@/stores/connections-store";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ConnectionMessage } from "@/types";

type ConnectionStatus = "pending" | "email_sent" | "clicked" | "accepted";

const EMPTY_MESSAGES: ConnectionMessage[] = [];

interface ConnectionChatProps {
  connectionId: string;
  connectionStatus: ConnectionStatus;
  onAccept?: (id: string) => void;
  isAccepting?: boolean;
  isBuilder?: boolean;
}

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DateSeparator({ date }: { date: string }) {
  const t = useTranslations("ConnectionChat");
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const label = isToday
    ? t("today")
    : isYesterday
      ? t("yesterday")
      : d.toLocaleDateString();

  return (
    <div className="flex justify-center py-3">
      <span className="rounded-full bg-background-secondary/50 px-3 py-1 text-xs text-foreground-muted">
        {label}
      </span>
    </div>
  );
}

function SystemMessage({ message }: { message: ConnectionMessage }) {
  const t = useTranslations("ConnectionChat");
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-4"
    >
      <div className="rounded-xl border bg-background-secondary/30 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Bot className="h-4 w-4 text-foreground-muted" />
          <span className="text-xs font-medium text-foreground-muted">{t("aiOutreach")}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        <p className="mt-2 text-right text-xs text-foreground-muted">
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}

function ChatBubble({
  message,
  isOwn,
}: {
  message: ConnectionMessage;
  isOwn: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex px-4 ${isOwn ? "justify-end" : "justify-start"}`}
    >
      <div className="max-w-[80%]">
        {!isOwn && message.sender?.name && (
          <p className="mb-1 px-1 text-xs text-foreground-muted">{message.sender.name}</p>
        )}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isOwn
              ? "bg-highlight text-highlight-foreground"
              : "bg-background-secondary/50"
          }`}
        >
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        </div>
        <p className={`mt-1 text-xs text-foreground-muted ${isOwn ? "text-right" : "text-left"} px-1`}>
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}

export function ConnectionChat({
  connectionId,
  connectionStatus,
  onAccept,
  isAccepting,
  isBuilder,
}: ConnectionChatProps) {
  const t = useTranslations("ConnectionChat");
  const user = useAuthStore((s) => s.user);
  const messages = useConnectionsStore((s) => s.chatMessages.get(connectionId) ?? EMPTY_MESSAGES);
  const isLoading = useConnectionsStore((s) => s.chatLoading.has(connectionId));
  const fetchMessages = useConnectionsStore((s) => s.fetchMessages);
  const sendMessage = useConnectionsStore((s) => s.sendMessage);
  const startPolling = useConnectionsStore((s) => s.startPolling);
  const stopPolling = useConnectionsStore((s) => s.stopPolling);

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const canChat = connectionStatus === "accepted";

  const placeholder = !canChat
    ? isBuilder
      ? t("placeholderPendingBuilder")
      : t("placeholderPendingSeeker")
    : t("placeholder");

  // Fetch messages and start polling
  useEffect(() => {
    fetchMessages(connectionId);
    startPolling(connectionId);
    return () => stopPolling();
  }, [connectionId, fetchMessages, startPolling, stopPolling]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!userScrolledUp) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, userScrolledUp]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atBottom = scrollHeight - scrollTop - clientHeight < 60;
    setUserScrolledUp(!atBottom);
  }, []);

  useEffect(() => {
    const el = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content || !canChat || !user) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setUserScrolledUp(false);
    sendMessage(connectionId, content, {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    });
  }, [input, canChat, user, connectionId, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  // Group messages with date separators
  const renderMessages = () => {
    const items: React.ReactNode[] = [];
    let lastDate = "";

    for (const msg of messages) {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== lastDate) {
        items.push(<DateSeparator key={`date-${msgDate}`} date={msg.createdAt} />);
        lastDate = msgDate;
      }

      if (msg.isSystem) {
        items.push(<SystemMessage key={msg.id} message={msg} />);
      } else {
        items.push(
          <ChatBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === user?.id}
          />
        );
      }
    }

    return items;
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages area */}
      <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1">
        <div className="flex flex-col gap-2 py-4">
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
            </div>
          ) : (
            renderMessages()
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Accept banner (builder only, not yet accepted) */}
      {isBuilder && !canChat && onAccept && (
        <div className="border-t border-border px-4 py-3">
          <div className="glass flex items-center gap-3 rounded-xl p-3">
            <p className="flex-1 text-sm text-foreground-muted">{t("acceptToChat")}</p>
            <Button
              size="sm"
              onClick={() => onAccept(connectionId)}
              disabled={isAccepting}
            >
              {isAccepting ? t("accepting") : t("acceptConnection")}
            </Button>
          </div>
        </div>
      )}

      {/* Chat input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={!canChat}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-foreground-muted/60 focus:border-highlight disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!canChat || !input.trim()}
            className="h-10 w-10 shrink-0 rounded-xl"
            aria-label={t("sendMessage")}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
