"use client";

import { motion } from "motion/react";
import { Info, Rocket } from "lucide-react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { slideUp } from "@/lib/motion";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import type { DiscoveryMessage } from "@/types";

interface ChatMessageProps {
  message: DiscoveryMessage;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const t = useTranslations("Chat");
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

  // Cards messages — show as "view in panel" link
  if (message.type === "cards" && message.cards?.length) {
    return (
      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="flex justify-center py-2"
      >
        <button
          onClick={() => {
            useAgentPanelStore.getState().setPanelOpen(true);
            useAgentPanelStore.getState().setActiveTab("scout");
          }}
          className="flex items-center gap-2 rounded-full bg-background-secondary/60 px-4 py-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors"
        >
          <Rocket className="h-3.5 w-3.5" />
          {t("startupsFound", { count: message.cards.length })}
        </button>
      </motion.div>
    );
  }

  // Regular text messages
  const displayContent = message.content;

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
