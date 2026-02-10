"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { GlassCard } from "@/components/ui/glass-card";
import { ConfidenceMeter } from "@/components/ui/confidence-meter";
import { Badge } from "@/components/ui/badge";
import { slideUp } from "@/lib/motion";
import { useComparisonStore } from "@/stores/comparison-store";
import type { Startup } from "@/types";
import { cn } from "@/lib/utils";

interface MatchScoreCardProps {
  startup: Startup;
  index?: number;
}

export function MatchScoreCard({ startup, index = 0 }: MatchScoreCardProps) {
  const { addStartup, removeStartup, isSelected } = useComparisonStore();
  const selected = isSelected(startup.id);

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selected) {
      removeStartup(startup.id);
    } else {
      addStartup(startup.id);
    }
  };

  return (
    <motion.div variants={slideUp} custom={index}>
      <Link href={`/results/${startup.id}`}>
        <GlassCard
          className={cn(
            "group cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all",
            selected && "border-highlight/30"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-highlight/10 font-code text-sm font-bold text-highlight">
                {startup.logo}
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-highlight transition-colors">
                  {startup.name}
                </h3>
                <p className="text-xs text-foreground-muted">
                  {startup.tagline}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold font-code text-highlight">
                {startup.aiAnalysis.matchScore}%
              </div>
              <p className="text-xs text-foreground-muted">match</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {startup.industries.map((industry) => (
              <Badge key={industry} variant="secondary" className="text-xs">
                {industry}
              </Badge>
            ))}
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-foreground-muted mb-1">
              <span>Confidence</span>
            </div>
            <ConfidenceMeter
              value={startup.aiAnalysis.confidence}
              size="sm"
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-code text-sm font-medium">
                {startup.fundingStage}
              </p>
              <p className="text-xs text-foreground-muted">Funding</p>
            </div>
            <div>
              <p className="font-code text-sm font-medium">
                {startup.employees}
              </p>
              <p className="text-xs text-foreground-muted">Employees</p>
            </div>
            <div>
              <p className="font-code text-sm font-medium">
                {startup.metrics.revenueGrowth}%
              </p>
              <p className="text-xs text-foreground-muted">Growth</p>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={toggleCompare}
              className={cn(
                "text-xs px-2 py-1 rounded border transition-colors",
                selected
                  ? "border-highlight bg-highlight/10 text-highlight"
                  : "border-border text-foreground-muted hover:border-highlight/50"
              )}
            >
              {selected ? "In Compare" : "Compare"}
            </button>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
