"use client";

import { Brain, Target, Zap } from "lucide-react";
import { motion } from "motion/react";
import { slideUp, staggerContainer } from "@/lib/motion";

const props = [
  {
    icon: Brain,
    title: "AI Analysis",
    subtitle: "Deep Intelligence",
    description:
      "Five specialized AI agents work together to deeply analyze startups across technology, market fit, financials, and team strength.",
    features: ["Multi-Agent Pipeline", "Deep Analysis", "Real-time Processing"],
  },
  {
    icon: Target,
    title: "Precision Matching",
    subtitle: "50+ Dimensions",
    description:
      "Our matching algorithm evaluates 50+ dimensions to find startups that truly align with your specific business challenges.",
    features: ["Custom Scoring", "Market Fit Analysis", "Risk Assessment"],
  },
  {
    icon: Zap,
    title: "Real-time Pipeline",
    subtitle: "Transparent Tracking",
    description:
      "Watch as AI agents navigate, scout, analyze, match, and report in real-time with transparent progress tracking.",
    features: ["Live Updates", "Stage Visibility", "Instant Reports"],
  },
];

export function ValueProps() {
  return (
    <section id="features" className="relative py-32 overflow-hidden ambient-glow-blue">
      <div className="absolute inset-0 bg-void" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-divider to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="inline-block font-mono text-xs tracking-[0.3em] text-text-muted mb-4 uppercase">
            What We Offer
          </span>
          <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl tracking-tight mb-6">
            <span className="text-text">Intelligent Matching, </span>
            <span className="text-text-dim">Simplified</span>
          </h2>
          <p className="max-w-2xl mx-auto text-text-dim text-lg">
            MatchPoint combines advanced AI with deep startup intelligence to
            deliver actionable insights for corporate innovation teams.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-4 lg:gap-5 md:grid-cols-3"
        >
          {props.map(({ icon: Icon, title, subtitle, description, features }) => (
            <motion.div key={title} variants={slideUp} className="group">
              <div className="h-full p-8 bg-void-light border border-border-base rounded-2xl transition-colors duration-300 group-hover:border-border-hover card-elevated">
                <div className="mb-6">
                  <div className="w-10 h-10 rounded-lg bg-icon-bg border border-icon-border flex items-center justify-center">
                    <Icon className="h-5 w-5 text-icon" />
                  </div>
                </div>

                <span className="font-mono text-[10px] text-text-muted tracking-wider uppercase">
                  {subtitle}
                </span>
                <h3 className="font-display font-semibold text-xl mt-1 mb-3 text-text">
                  {title}
                </h3>
                <p className="text-text-dim text-sm leading-relaxed mb-6">
                  {description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface text-text-muted border border-border-base"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
