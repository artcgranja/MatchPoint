"use client";

import { MessageCircle, Brain, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionStage } from "@/types";

const STAGES: {
  key: SessionStage;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "discovery", label: "Discovery", icon: MessageCircle },
  { key: "analysis", label: "Analysis", icon: Brain },
  { key: "scout", label: "Scout", icon: Search },
];

const STAGE_ORDER: SessionStage[] = ["discovery", "analysis", "scout", "complete"];

interface StageIndicatorProps {
  currentStage: SessionStage;
}

export function StageIndicator({ currentStage }: StageIndicatorProps) {
  const currentIdx = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="flex items-center justify-center gap-1">
      {STAGES.map((stage, index) => {
        const stageIdx = STAGE_ORDER.indexOf(stage.key);
        const isComplete = stageIdx < currentIdx;
        const isCurrent = stage.key === currentStage;
        const Icon = isComplete ? Check : stage.icon;

        return (
          <div key={stage.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300",
                  isComplete && "bg-sage/15 text-sage",
                  isCurrent && "bg-highlight/15 text-highlight ring-2 ring-highlight/20",
                  !isComplete && !isCurrent && "bg-foreground-muted/10 text-foreground-muted/40"
                )}
              >
                <Icon className={cn("h-4 w-4", isCurrent && "animate-pulse")} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isComplete && "text-sage",
                  isCurrent && "text-highlight",
                  !isComplete && !isCurrent && "text-foreground-muted/40"
                )}
              >
                {stage.label}
              </span>
            </div>

            {index < STAGES.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-px w-8 md:w-12 self-start mt-[18px]",
                  stageIdx < currentIdx ? "bg-sage/50" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
