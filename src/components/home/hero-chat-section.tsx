"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { WarpShaderBackground } from "@/components/ui/warp-shader-background";
import { ChatInput } from "@/components/discovery/chat-input";
import { MinimalNavbar } from "@/components/home/minimal-navbar";
import { CondensedValueProps } from "@/components/home/condensed-value-props";
import { PipelineSection } from "@/components/home/pipeline-section";
import { CTASection } from "@/components/home/cta-section";
import { Footer } from "@/components/home/footer";
import { slideUp, staggerContainer } from "@/lib/motion";
import type { SessionStage } from "@/types";

interface HeroChatSectionProps {
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  currentStage: SessionStage;
}

export function HeroChatSection({
  onSendMessage,
  isStreaming,
  currentStage,
}: HeroChatSectionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col overflow-y-auto">
      {/* Full-viewport hero area */}
      <div
        className="relative flex min-h-screen flex-col items-center justify-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Shader — full area, masked to fade from bottom (visible) to top (transparent) */}
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
              maskImage: "linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.12) 65%, rgba(0,0,0,0.3) 78%, rgba(0,0,0,0.6) 88%, black 96%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.12) 65%, rgba(0,0,0,0.3) 78%, rgba(0,0,0,0.6) 88%, black 96%)",
            }}
          >
            <WarpShaderBackground isHovered={isHovered} />
          </div>
        )}

        {/* Minimal navbar */}
        <MinimalNavbar />

        {/* Centered hero content */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex w-full max-w-2xl flex-col items-center px-6"
        >
          {/* Eyebrow */}
          <motion.p
            variants={slideUp}
            className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-text-muted"
          >
            AI-Powered Startup Matching
          </motion.p>

          {/* Headline */}
          <motion.h1
            variants={slideUp}
            className="mb-3 text-center font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            O que vamos{" "}
            <span className="text-gradient">resolver</span>?
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={slideUp}
            className="mb-10 max-w-lg text-center text-base text-text/60 sm:text-lg"
          >
            Descreva seu desafio e nossos agentes de IA encontram as melhores
            startups para sua empresa.
          </motion.p>

          {/* Chat input */}
          <motion.div variants={slideUp} className="w-full">
            <ChatInput
              onSend={onSendMessage}
              disabled={isStreaming}
              currentStage={currentStage}
              variant="hero"
            />
          </motion.div>
        </motion.div>

        {/* Bottom gradient fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1] h-32 bg-gradient-to-t from-void to-transparent" />
      </div>

      {/* Below the fold */}
      <div className="bg-void">
        <CondensedValueProps />
        <PipelineSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
