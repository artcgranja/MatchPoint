"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { WarpShaderBackground } from "@/components/ui/warp-shader-background";
import { slideUp, staggerContainer } from "@/lib/motion";

const previewScores = [
  { name: "NeuralShift AI", score: 95, label: "AI/ML" },
  { name: "DataWeave", score: 91, label: "Analytics" },
  { name: "MedVault", score: 92, label: "HealthTech" },
];

export function Hero() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="pt-24 sm:pt-28 pb-12 w-full flex justify-center items-center px-4 md:px-6 min-h-screen">
      <div className="w-full max-w-7xl relative">
        <div
          className="force-dark relative overflow-hidden rounded-[32px] md:rounded-[48px] border border-border-hover bg-void-light min-h-[600px] md:min-h-[700px] flex flex-col items-center justify-center transition-all duration-500"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Warp shader background */}
          <WarpShaderBackground isHovered={isHovered} />

          {/* Content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="relative z-10 px-6 max-w-4xl mx-auto text-center flex flex-col items-center"
          >
            <motion.p
              variants={slideUp}
              className="font-mono text-xs uppercase tracking-[0.3em] text-text-muted mb-6"
            >
              AI-Powered Corporate-Startup Matching
            </motion.p>

            <motion.h1
              variants={slideUp}
              className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.05]"
            >
              <span className="text-text">Find Your Perfect</span>
              <br />
              <span className="text-text/70">Startup Match</span>
            </motion.h1>

            <motion.p
              variants={slideUp}
              className="text-text/80 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed"
            >
              Describe your business challenge and let our AI agents find,
              evaluate, and rank the{" "}
              <span className="text-text font-medium">best startup partners</span>{" "}
              for your enterprise.
            </motion.p>

            <motion.div
              variants={slideUp}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <Link
                href="/search"
                className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-text px-10 text-base font-medium text-void transition-all duration-300 hover:bg-text/90 hover:scale-105 active:scale-95 hover:ring-4 hover:ring-text/20"
              >
                <span className="relative z-10">Start Matching</span>
                <ArrowRight className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-surface-elevated backdrop-blur-sm border border-border-prominent px-10 text-base font-medium text-text transition-all duration-300 hover:bg-surface-elevated-hover hover:border-border-bolder"
              >
                Learn More
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </motion.div>

            <motion.div
              variants={slideUp}
              className="mt-16 flex flex-wrap items-center justify-center gap-4"
            >
              {previewScores.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 px-4 py-3 bg-surface border border-border-base rounded-xl transition-all duration-300 hover:border-border-hover"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-icon-bg border border-icon-border font-mono text-sm font-bold text-icon">
                    {item.score}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-text">{item.name}</p>
                    <p className="text-xs text-text-muted">{item.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
