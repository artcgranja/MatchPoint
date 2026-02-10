"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GridBackground } from "@/components/ui/grid-background";
import { GlassCard } from "@/components/ui/glass-card";
import { slideUp, staggerContainer } from "@/lib/motion";

const previewScores = [
  { name: "NeuralShift AI", score: 95, label: "AI/ML" },
  { name: "DataWeave", score: 91, label: "Analytics" },
  { name: "MedVault", score: 92, label: "HealthTech" },
];

export function Hero() {
  return (
    <GridBackground className="min-h-screen flex items-center pt-16">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.p
            variants={slideUp}
            className="text-sm font-medium text-highlight mb-4"
          >
            AI-Powered Corporate-Startup Matching
          </motion.p>

          <motion.h1
            variants={slideUp}
            className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Find Your Perfect{" "}
            <span className="text-gradient">Startup Match</span>
          </motion.h1>

          <motion.p
            variants={slideUp}
            className="mx-auto mt-6 max-w-2xl text-lg text-foreground-muted"
          >
            Describe your business challenge and let our AI agents find,
            evaluate, and rank the best startup partners for your enterprise.
          </motion.p>

          <motion.div
            variants={slideUp}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Button asChild size="lg" className="gap-2">
              <Link href="/search">
                Start Matching
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how-it-works">Learn More</a>
            </Button>
          </motion.div>

          <motion.div
            variants={slideUp}
            className="mt-16 flex flex-wrap items-center justify-center gap-4"
          >
            {previewScores.map((item) => (
              <GlassCard
                key={item.name}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-highlight/10 text-highlight font-code text-sm font-bold">
                  {item.score}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-foreground-muted">{item.label}</p>
                </div>
              </GlassCard>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </GridBackground>
  );
}
