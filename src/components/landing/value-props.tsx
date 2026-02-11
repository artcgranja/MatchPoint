"use client";

import { useRef, useCallback } from "react";
import { Brain, Target, Zap } from "lucide-react";
import { motion } from "motion/react";
import { slideUp, staggerContainer } from "@/lib/motion";

const props = [
  {
    icon: Brain,
    title: "AI Analysis",
    subtitle: "Deep Intelligence",
    stat: "5",
    statLabel: "AI Agents Working Together",
    description:
      "Five specialized AI agents work together to deeply analyze startups across technology, market fit, financials, and team strength.",
    features: ["Multi-Agent Pipeline", "Deep Analysis", "Real-time Processing"],
    size: "large" as const,
  },
  {
    icon: Target,
    title: "Precision Matching",
    subtitle: "50+ Dimensions",
    stat: "50+",
    statLabel: "Evaluation Dimensions",
    description:
      "Our algorithm evaluates 50+ dimensions to find startups that truly align with your business challenges.",
    features: [],
    size: "small" as const,
  },
  {
    icon: Zap,
    title: "Real-time Pipeline",
    subtitle: "Transparent Tracking",
    stat: "< 5min",
    statLabel: "Average Analysis Time",
    description:
      "Watch AI agents navigate, scout, analyze, match, and report in real-time with transparent progress.",
    features: [],
    size: "small" as const,
  },
];

export function ValueProps() {
  const gridRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const cards = gridRef.current?.querySelectorAll<HTMLElement>(".spotlight-card");
    cards?.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  }, []);

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
          ref={gridRef}
          onMouseMove={handleMouseMove}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-6 gap-4 lg:gap-5"
        >
          {props.map(({ icon: Icon, title, subtitle, stat, statLabel, description, features, size }) => {
            const isLarge = size === "large";
            return (
              <motion.div
                key={title}
                variants={slideUp}
                className={`group ${isLarge ? "md:col-span-4 md:row-span-2" : "md:col-span-2"}`}
              >
                <div
                  className={`spotlight-card h-full bg-void-light border border-border-base rounded-2xl transition-all duration-300 group-hover:border-border-hover card-elevated relative overflow-hidden ${
                    isLarge ? "p-10 lg:p-12" : "p-8"
                  }`}
                >
                  {/* Inner glow for hero card */}
                  {isLarge && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(ellipse at 20% 80%, rgba(37,99,235,0.08), transparent 60%)",
                      }}
                    />
                  )}

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="mb-6">
                      <div className="w-10 h-10 rounded-lg bg-icon-bg border border-icon-border flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                        <Icon className="h-5 w-5 text-icon" />
                      </div>
                    </div>

                    {/* Stat number */}
                    <div className="mb-4">
                      <span
                        className={`font-display font-bold tracking-tight ${
                          isLarge
                            ? "text-[64px] leading-none text-gradient"
                            : "text-[40px] leading-none text-text"
                        }`}
                      >
                        {stat}
                      </span>
                      <span className="block font-mono text-[10px] text-text-muted tracking-wider uppercase mt-2">
                        {statLabel}
                      </span>
                    </div>

                    {/* Content */}
                    <span className="font-mono text-[10px] text-text-muted tracking-wider uppercase">
                      {subtitle}
                    </span>
                    <h3 className="font-display font-semibold text-xl mt-1 mb-3 text-text">
                      {title}
                    </h3>
                    <p className={`text-text-dim leading-relaxed ${isLarge ? "text-sm lg:text-base max-w-xl" : "text-sm"}`}>
                      {description}
                    </p>

                    {/* Feature tags (only for large card) */}
                    {features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-6">
                        {features.map((feature) => (
                          <span
                            key={feature}
                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface text-text-muted border border-border-base"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
