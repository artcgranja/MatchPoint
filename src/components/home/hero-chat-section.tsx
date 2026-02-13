"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Landing");
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <section aria-label={t("heroLabel")} className="relative flex min-h-screen flex-col">
      {/* Full-viewport hero area */}
      <div
        className="relative flex min-h-screen flex-col items-center justify-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Shader — fade top-to-bottom (opacity on shader itself), bottom edge curved/oval */}
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
            {t("heroBadge")}
          </motion.p>

          {/* Headline */}
          <motion.h1
            variants={slideUp}
            className="mb-3 text-center font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {t.rich("heroTitle", {
              highlight: (chunks) => (
                <span className="text-gradient">{chunks}</span>
              ),
            })}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={slideUp}
            className="mb-10 max-w-lg text-center text-base text-text/60 sm:text-lg"
          >
            {t("heroDescription")}
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
      </div>

      {/* Below the fold */}
      <div className="bg-void">
        <CondensedValueProps />
        <PipelineSection />
        <CTASection />
        <Footer />
      </div>
    </section>
  );
}
