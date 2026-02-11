"use client";

import { cn } from "@/lib/utils";
import type { SessionStage } from "@/types";

const STAGES: { key: SessionStage; label: string }[] = [
  { key: "discovery", label: "Discovery" },
  { key: "analysis", label: "Analysis" },
  { key: "scout", label: "Scout" },
];

const STAGE_ORDER: SessionStage[] = ["discovery", "analysis", "scout", "complete"];

interface StageIndicatorProps {
  currentStage: SessionStage;
}

export function StageIndicator({ currentStage }: StageIndicatorProps) {
  const currentIdx = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="flex items-center gap-1 rounded-lg bg-background-secondary/50 p-1">
      {STAGES.map((stage) => {
        const stageIdx = STAGE_ORDER.indexOf(stage.key);
        const isCurrent = stage.key === currentStage;
        const isPast = stageIdx < currentIdx;

        return (
          <div
            key={stage.key}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-300",
              isCurrent &&
                "bg-highlight/15 text-highlight shadow-[0_0_12px_rgba(59,130,246,0.15)]",
              isPast && "text-foreground-muted",
              !isCurrent && !isPast && "text-foreground-muted/40"
            )}
          >
            {stage.label}
          </div>
        );
      })}
    </div>
  );
}
