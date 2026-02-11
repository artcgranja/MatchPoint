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
    name: "Scout",
    description:
      "Searches startup databases and aggregators to build a comprehensive candidate pool.",
  },
  {
    number: "03",
    name: "Analyst",
    description:
      "Deep-dives into financials, technology stack, traction metrics, and competitive positioning.",
  },
  {
    number: "04",
    name: "Matchmaker",
    description:
      "Scores and ranks startups across 50+ dimensions to find your ideal partners.",
  },
  {
    number: "05",
    name: "Reporter",
    description:
      "Generates comprehensive reports with actionable insights and recommendations.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-32 overflow-hidden"
    >
      <div className="absolute inset-0 bg-void" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-divider to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Header */}
          <div className="text-center mb-20">
            <motion.span
              variants={slideUp}
              className="inline-block font-mono text-xs uppercase tracking-[0.3em] text-text-muted mb-4"
            >
              How It Works
            </motion.span>

            <motion.h2
              variants={slideUp}
              className="font-display font-bold text-4xl sm:text-5xl md:text-6xl tracking-tight mb-6"
            >
              <span className="text-text">Five AI Agents, </span>
              <span className="text-text-dim">One Pipeline</span>
            </motion.h2>

            <motion.p
              variants={slideUp}
              className="max-w-2xl mx-auto text-text-dim text-lg"
            >
              Each agent specializes in a critical phase of the discovery
              process, working together to deliver precise results.
            </motion.p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line — desktop center, mobile left */}
            <div className="absolute top-0 bottom-0 left-4 md:left-1/2 md:-translate-x-px w-px bg-gradient-to-b from-border-base via-highlight/20 to-border-base" />

            <div className="space-y-8 md:space-y-12">
              {stages.map((step, index) => {
                const isLeft = index % 2 === 0;
                return (
                  <motion.div
                    key={step.number}
                    variants={slideUp}
                    className="relative flex items-start md:items-center"
                  >
                    {/* Dot on the line */}
                    <div className="absolute left-4 md:left-1/2 -translate-x-1/2 top-8 md:top-1/2 md:-translate-y-1/2 z-20">
                      <div className="w-3 h-3 rounded-full bg-highlight border-2 border-void" />
                    </div>

                    {/* Card positioning */}
                    <div
                      className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${
                        isLeft
                          ? "md:mr-auto md:pr-0"
                          : "md:ml-auto md:pl-0"
                      }`}
                    >
                      <div className="group shine-sweep dot-grid bg-void-light border border-border-base rounded-2xl p-8 relative overflow-hidden card-elevated transition-all duration-300 hover:border-border-hover">
                        {/* Large number background */}
                        <span className="absolute -top-4 -right-2 font-display text-[100px] font-bold text-decorative leading-none select-none pointer-events-none">
                          {step.number}
                        </span>

                        {/* Content */}
                        <div className="relative z-10">
                          <span className="font-mono text-xs text-highlight tracking-wider uppercase mb-3 block">
                            Stage {step.number}
                          </span>
                          <h3 className="font-display text-xl font-semibold text-text mb-3">
                            {step.name}
                          </h3>
                          <p className="text-sm text-text-dim leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <motion.div variants={slideUp} className="text-center mt-20">
            <a
              href="/search"
              className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-text px-10 text-base font-medium text-void transition-all duration-300 hover:bg-text/90 hover:scale-105 active:scale-95 hover:ring-4 hover:ring-text/20"
            >
              Start Matching Now
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
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
