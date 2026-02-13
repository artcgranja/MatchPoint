"use client";

import { useTranslations } from "next-intl";
import { Brain, Target, Zap } from "lucide-react";
import { slideUp, staggerContainer } from "@/lib/motion";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import {
  AnimateOnScroll,
  AnimateOnScrollItem,
} from "@/components/ui/animate-on-scroll";

const featureKeys = [
  {
    icon: Brain,
    titleKey: "aiAnalysis" as const,
    descriptionKey: "aiAnalysisDescription" as const,
    statsKey: "aiAnalysisMetric" as const,
    detailKey: "aiAnalysisMetricLabel" as const,
  },
  {
    icon: Target,
    titleKey: "precisionMatching" as const,
    descriptionKey: "precisionMatchingDescription" as const,
    statsKey: "precisionMatchingMetric" as const,
    detailKey: "precisionMatchingMetricLabel" as const,
  },
  {
    icon: Zap,
    titleKey: "realtimePipeline" as const,
    descriptionKey: "realtimePipelineDescription" as const,
    statsKey: "realtimePipelineMetric" as const,
    detailKey: "realtimePipelineMetricLabel" as const,
  },
];

export function CondensedValueProps() {
  const t = useTranslations("Landing");

  return (
    <section id="como-funciona" className="relative py-24" aria-label={t("howItWorks")}>
      {/* Ambient glow */}
      <div className="ambient-glow-blue absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* Section header */}
        <AnimateOnScroll variants={staggerContainer} className="mb-16 text-center">
          <AnimateOnScrollItem variants={slideUp}>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-highlight">
              {t("howItWorks")}
            </p>
          </AnimateOnScrollItem>
          <AnimateOnScrollItem variants={slideUp}>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {t.rich("howItWorksTitle", {
                highlight: (chunks) => (
                  <span className="text-gradient">{chunks}</span>
                ),
              })}
            </h2>
          </AnimateOnScrollItem>
          <AnimateOnScrollItem variants={slideUp}>
            <p className="mx-auto mt-4 max-w-2xl text-base text-foreground-muted">
              {t("howItWorksDescription")}
            </p>
          </AnimateOnScrollItem>
        </AnimateOnScroll>

        {/* Feature cards grid */}
        <AnimateOnScroll
          variants={staggerContainer}
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {featureKeys.map(({ icon: Icon, titleKey, descriptionKey, statsKey, detailKey }) => (
            <AnimateOnScrollItem key={titleKey} variants={slideUp}>
              <SpotlightCard>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-highlight/10 text-highlight">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-mono text-lg font-bold text-highlight">
                      {t(statsKey)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      {t(detailKey)}
                    </p>
                  </div>
                </div>
                <h3 className="mb-2 text-base font-semibold">{t(titleKey)}</h3>
                <p className="text-sm leading-relaxed text-foreground-muted">
                  {t(descriptionKey)}
                </p>
              </SpotlightCard>
            </AnimateOnScrollItem>
          ))}
        </AnimateOnScroll>
      </div>
    </section>
  );
}
