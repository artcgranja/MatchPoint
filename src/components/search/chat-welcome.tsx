"use client";

import { motion } from "motion/react";
import { fadeIn, slideUp, staggerContainer } from "@/lib/motion";
import { ChatInput } from "@/components/discovery/chat-input";
import { SuggestionChips } from "@/components/search/suggestion-chips";
import type { SessionStage } from "@/types";

interface ChatWelcomeProps {
  onSendMessage: (text: string) => void;
  onChipSelect: (suggestion: string) => void;
  isStreaming: boolean;
  currentStage: SessionStage;
}

export function ChatWelcome({
  onSendMessage,
  onChipSelect,
  isStreaming,
  currentStage,
}: ChatWelcomeProps) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
      {/* Background glow effect */}
      <div className="welcome-glow absolute inset-0" aria-hidden="true" />

      {/* Content */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex w-full max-w-2xl flex-col items-center px-6"
      >
        {/* Title */}
        <motion.h1
          variants={slideUp}
          className="mb-8 text-center font-heading text-3xl font-bold tracking-tight sm:text-4xl"
        >
          O que vamos{" "}
          <span className="text-gradient">resolver</span>?
        </motion.h1>

        {/* Chat input */}
        <motion.div variants={slideUp} className="w-full">
          <ChatInput
            onSend={onSendMessage}
            disabled={isStreaming}
            currentStage={currentStage}
            variant="welcome"
          />
        </motion.div>

        {/* Suggestion chips */}
        <motion.div variants={fadeIn} className="mt-4 w-full">
          <SuggestionChips onSelect={onChipSelect} variant="compact" disabled={isStreaming} />
        </motion.div>
      </motion.div>
    </div>
  );
}
