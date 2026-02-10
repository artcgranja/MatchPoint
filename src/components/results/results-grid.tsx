"use client";

import { motion } from "motion/react";
import { staggerContainer } from "@/lib/motion";
import { MatchScoreCard } from "@/components/results/match-score-card";
import { useResultsStore } from "@/stores/results-store";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Startup } from "@/types";

interface ResultsGridProps {
  startups: Startup[];
  loading?: boolean;
}

export function ResultsGrid({ startups, loading }: ResultsGridProps) {
  const { viewMode } = useResultsStore();

  if (loading) {
    return (
      <div
        className={cn(
          "grid gap-4",
          viewMode === "grid"
            ? "md:grid-cols-2 xl:grid-cols-3"
            : "grid-cols-1"
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={cn(
        "grid gap-4",
        viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
      )}
    >
      {startups.map((startup, index) => (
        <MatchScoreCard key={startup.id} startup={startup} index={index} />
      ))}
    </motion.div>
  );
}
