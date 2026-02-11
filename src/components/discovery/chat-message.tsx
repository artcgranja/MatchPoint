"use client";

import { motion } from "motion/react";
import { Compass, User, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { slideUp } from "@/lib/motion";
import { StartupCard } from "./startup-card";
import type { DiscoveryMessage } from "@/types";

interface ChatMessageProps {
  message: DiscoveryMessage;
  isStreaming?: boolean;
}

function stripMarkers(text: string) {
  return text.replace(/\[DISCOVERY_COMPLETE\]/g, "").trim();
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Stage update messages
  if (message.type === "stage-update") {
    return (
      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="flex justify-center py-2"
      >
        <div className="flex items-center gap-2 rounded-full bg-background-secondary/60 px-4 py-1.5">
          <Info className="h-3.5 w-3.5 text-foreground-muted" />
          <span className="text-xs text-foreground-muted">{message.content}</span>
        </div>
      </motion.div>
    );
  }

  // Cards messages
  if (message.type === "cards" && message.cards?.length) {
    return (
      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground-muted/10 text-foreground-muted">
            <Compass className="h-4 w-4" />
          </div>
          <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed glass border border-border">
            <p className="whitespace-pre-wrap">{stripMarkers(message.content)}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 pl-11">
          {message.cards.map((card) => (
            <StartupCard key={card.id} card={card} />
          ))}
        </div>
      </motion.div>
    );
  }

  // Regular text messages
  const displayContent = stripMarkers(message.content);

  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-highlight/10 text-highlight"
            : "bg-foreground-muted/10 text-foreground-muted"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Compass className="h-4 w-4" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-highlight text-highlight-foreground"
            : "glass border border-border"
        )}
      >
        <p className="whitespace-pre-wrap">{displayContent}</p>
        {isStreaming && !isUser && (
          <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-full bg-highlight" />
        )}
      </div>
    </motion.div>
  );
}
