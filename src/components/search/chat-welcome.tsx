"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { WarpShaderBackground } from "@/components/ui/warp-shader-background";
import { ChatInput } from "@/components/discovery/chat-input";
import { slideUp, staggerContainer } from "@/lib/motion";
import type { SessionStage } from "@/types";

interface ChatWelcomeProps {
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  currentStage: SessionStage;
}

export function ChatWelcome({
  onSendMessage,
  isStreaming,
  currentStage,
}: ChatWelcomeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Shader — same effect as landing page */}
      {prefersReducedMotion ? (
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 80%, hsl(217, 91%, 20%) 0%, hsl(215, 50%, 10%) 40%, transparent 70%)",
          }}
        />
      ) : (
        <div
          className="absolute inset-0 z-0"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, transparent 38%, rgba(0,0,0,0.08) 48%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.5) 63%, rgba(0,0,0,0.75) 72%, black 82%, black 100%), radial-gradient(ellipse 130% 55% at 50% 100%, black 0%, black 75%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, transparent 38%, rgba(0,0,0,0.08) 48%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.5) 63%, rgba(0,0,0,0.75) 72%, black 82%, black 100%), radial-gradient(ellipse 130% 55% at 50% 100%, black 0%, black 75%, transparent 100%)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        >
          <WarpShaderBackground isHovered={isHovered} />
        </div>
      )}

      {/* Content — same max-w-2xl and hero chat size as landing */}
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

        {/* Chat input — hero variant: same size/style as landing */}
        <motion.div variants={slideUp} className="w-full">
          <ChatInput
            onSend={onSendMessage}
            disabled={isStreaming}
            currentStage={currentStage}
            variant="hero"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
