"use client";

import { Compass, Search, BarChart3, Heart, FileText } from "lucide-react";
import { motion } from "motion/react";
import { GlassCard } from "@/components/ui/glass-card";
import { slideUp, staggerContainer } from "@/lib/motion";

const stages = [
  {
    icon: Compass,
    name: "Navigator",
    description: "Understands your business challenge and defines search parameters",
  },
  {
    icon: Search,
    name: "Scout",
    description: "Searches databases to find potential startup matches",
  },
  {
    icon: BarChart3,
    name: "Analyst",
    description: "Deep-dives into financials, metrics, and technology fit",
  },
  {
    icon: Heart,
    name: "Matchmaker",
    description: "Scores and ranks startups based on multi-dimensional analysis",
  },
  {
    icon: FileText,
    name: "Reporter",
    description: "Generates comprehensive reports with actionable recommendations",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-background-secondary/50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            How <span className="text-gradient">MatchPoint</span> Works
          </h2>
          <p className="mt-4 text-foreground-muted max-w-2xl mx-auto">
            Five AI agents work in a coordinated pipeline to deliver
            comprehensive startup analysis in minutes, not weeks.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative flex flex-col gap-4 md:flex-row md:gap-6"
        >
          {stages.map(({ icon: Icon, name, description }, index) => (
            <motion.div key={name} variants={slideUp} className="flex-1 relative">
              <GlassCard className="h-full text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-highlight/10">
                  <Icon className="h-5 w-5 text-highlight" />
                </div>
                <div className="mb-1 font-code text-xs text-highlight">
                  Step {index + 1}
                </div>
                <h3 className="text-base font-semibold">{name}</h3>
                <p className="mt-1 text-xs text-foreground-muted">
                  {description}
                </p>
              </GlassCard>
              {index < stages.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 z-10 h-px w-6 bg-highlight/30" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
