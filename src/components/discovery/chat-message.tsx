"use client";

import { motion } from "motion/react";
import { Compass, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { slideUp } from "@/lib/motion";
import type { DiscoveryMessage } from "@/types";

interface ChatMessageProps {
  message: DiscoveryMessage;
  isStreaming?: boolean;
}

function stripPhaseMarkers(text: string) {
  return text.replace(/\[PHASE:\s*\w+\]/g, "").trim();
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";
  const displayContent = stripPhaseMarkers(message.content);

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
            ? "bg-highlight text-white"
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
