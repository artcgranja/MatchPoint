"use client";

import { Brain, Target, Zap } from "lucide-react";
import { motion } from "motion/react";
import { GlassCard } from "@/components/ui/glass-card";
import { slideUp, staggerContainer } from "@/lib/motion";

const props = [
  {
    icon: Brain,
    title: "AI Analysis",
    description:
      "Five specialized AI agents work together to deeply analyze startups across technology, market fit, financials, and team strength.",
  },
  {
    icon: Target,
    title: "Precision Matching",
    description:
      "Our matching algorithm evaluates 50+ dimensions to find startups that truly align with your specific business challenges.",
  },
  {
    icon: Zap,
    title: "Real-time Pipeline",
    description:
      "Watch as AI agents navigate, scout, analyze, match, and report in real-time with transparent progress tracking.",
  },
];

export function ValueProps() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Intelligent Matching, <span className="text-gradient">Simplified</span>
          </h2>
          <p className="mt-4 text-foreground-muted max-w-2xl mx-auto">
            MatchPoint combines advanced AI with deep startup intelligence to
            deliver actionable insights for corporate innovation teams.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 md:grid-cols-3"
        >
          {props.map(({ icon: Icon, title, description }) => (
            <motion.div key={title} variants={slideUp}>
              <GlassCard className="h-full text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-highlight/10">
                  <Icon className="h-6 w-6 text-highlight" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  {description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
