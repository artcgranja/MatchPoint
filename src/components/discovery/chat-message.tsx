"use client";

import { motion } from "motion/react";
import { Info } from "lucide-react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
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
        <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed dark:prose-invert">
          <Streamdown plugins={{ code }} isAnimating={false}>
            {stripMarkers(message.content)}
          </Streamdown>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {message.cards.map((card) => (
            <StartupCard key={card.id} card={card} />
          ))}
        </div>
      </motion.div>
    );
  }

  // Regular text messages
  const displayContent = stripMarkers(message.content);

  if (isUser) {
    return (
      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-2xl bg-highlight px-4 py-3 text-sm leading-relaxed text-highlight-foreground">
          <p className="whitespace-pre-wrap">{displayContent}</p>
        </div>
      </motion.div>
    );
  }

  // Assistant text message — clean, no background
  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      className={cn(
        "prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-li:text-foreground/90 prose-strong:text-foreground dark:prose-invert",
        isStreaming && "[&_.sd-caret]:inline-block"
      )}
    >
      <Streamdown
        plugins={{ code }}
        isAnimating={!!isStreaming}
        caret={isStreaming ? "block" : undefined}
      >
        {displayContent}
      </Streamdown>
    </motion.div>
  );
}
