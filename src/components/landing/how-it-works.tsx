"use client";

import { motion } from "motion/react";
import { slideUp, staggerContainer } from "@/lib/motion";

const stages = [
  {
    number: "01",
    name: "Navigator",
    description:
      "Understands your business challenge and defines precise search parameters for optimal matching.",
  },
  {
    number: "02",
    name: "Scout & Analyst",
    description:
      "Searches startup databases and deep-dives into financials, metrics, and technology fit.",
  },
  {
    number: "03",
    name: "Matchmaker & Reporter",
    description:
      "Scores and ranks startups on multi-dimensional analysis, then generates comprehensive reports.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-16 md:py-24 w-full flex justify-center items-center px-4 md:px-6"
    >
      <div className="w-full max-w-7xl">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Header */}
          <div className="text-center mb-16">
            <motion.span
              variants={slideUp}
              className="inline-block font-mono text-xs uppercase tracking-[0.3em] text-text-muted mb-6"
            >
              How It Works
            </motion.span>

            <motion.h2
              variants={slideUp}
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-text"
            >
              Five AI Agents, One Pipeline
            </motion.h2>
          </div>

          {/* Process Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stages.map((step) => (
              <motion.div
                key={step.number}
                variants={slideUp}
                className="bg-void-light border border-border-base rounded-2xl p-8 relative overflow-hidden card-elevated"
              >
                {/* Large number background */}
                <span className="absolute -top-4 -left-2 font-display text-[120px] font-bold text-decorative leading-none select-none">
                  {step.number}
                </span>

                {/* Content */}
                <div className="relative z-10">
                  <span className="font-mono text-sm text-highlight mb-4 block">
                    {step.number}
                  </span>
                  <h3 className="font-display text-xl font-bold text-text mb-4">
                    {step.name}
                  </h3>
                  <p className="text-text-dim leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div variants={slideUp} className="text-center mt-16 md:mt-12">
            <a
              href="#contact"
              className="inline-flex items-center gap-3 font-display text-base font-medium px-8 py-4 rounded-full bg-text text-void hover:bg-text/90 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Start Matching Now
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
