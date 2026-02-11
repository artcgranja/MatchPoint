"use client";

import { motion } from "motion/react";
import { MapPin, TrendingUp } from "lucide-react";
import { scaleIn } from "@/lib/motion";
import type { StartupCard as StartupCardType } from "@/types";

interface StartupCardProps {
  card: StartupCardType;
}

export function StartupCard({ card }: StartupCardProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      className="glass rounded-xl border border-border p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-sm truncate">{card.name}</h4>
          <p className="text-xs text-foreground-muted truncate">{card.tagline}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0 rounded-full bg-highlight/10 px-2 py-0.5">
          <TrendingUp className="h-3 w-3 text-highlight" />
          <span className="text-[10px] font-medium text-highlight">{card.fundingStage}</span>
        </div>
      </div>

      <p className="text-xs text-foreground-muted leading-relaxed">{card.whyRelevant}</p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {card.industries.slice(0, 2).map((industry) => (
            <span
              key={industry}
              className="rounded-full bg-background-secondary/80 px-2 py-0.5 text-[10px] text-foreground-muted"
            >
              {industry}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-foreground-muted/60">
          <MapPin className="h-3 w-3" />
          <span className="text-[10px]">{card.location}</span>
        </div>
      </div>
    </motion.div>
  );
}
