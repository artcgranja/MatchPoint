"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Compass,
  Search,
  BarChart3,
  Heart,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { useSearchStore } from "@/stores/search-store";
import type { PipelineStatus } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  compass: Compass,
  search: Search,
  "bar-chart": BarChart3,
  heart: Heart,
  "file-text": FileText,
};

const stageMessages: Record<string, string[]> = {
  "stage-1": [
    "Parsing business challenge...",
    "Identifying key requirements...",
    "Defining search parameters...",
  ],
  "stage-2": [
    "Scanning startup databases...",
    "Filtering potential matches...",
    "Found 127 candidates...",
  ],
  "stage-3": [
    "Analyzing financials...",
    "Evaluating technology stacks...",
    "Scoring team composition...",
  ],
  "stage-4": [
    "Computing match scores...",
    "Ranking by multi-dimensional fit...",
    "Finalizing top matches...",
  ],
  "stage-5": [
    "Generating analysis report...",
    "Compiling recommendations...",
    "Report ready!",
  ],
};

export function AgentPipelineVisualizer() {
  const router = useRouter();
  const {
    pipelineStages,
    pipelineStatus,
    isSearching,
    updateStage,
    completePipeline,
  } = useSearchStore();

  const runPipeline = useCallback(() => {
    let totalDelay = 0;

    pipelineStages.forEach((stage, index) => {
      const stageDelay = totalDelay;
      const messages = stageMessages[stage.id] || ["Processing..."];

      // Start stage
      setTimeout(() => {
        updateStage(stage.id, {
          status: "running" as PipelineStatus,
          progress: 0,
          message: messages[0],
        });
      }, stageDelay);

      // Progress updates
      messages.forEach((message, msgIndex) => {
        const progressDelay =
          stageDelay + ((msgIndex + 1) * 1500) / messages.length;
        setTimeout(() => {
          updateStage(stage.id, {
            progress: Math.round(((msgIndex + 1) / messages.length) * 100),
            message,
          });
        }, progressDelay);
      });

      // Complete stage
      const completionDelay = stageDelay + 1500;
      setTimeout(() => {
        updateStage(stage.id, {
          status: "complete" as PipelineStatus,
          progress: 100,
          message: "Complete",
        });
      }, completionDelay);

      totalDelay = completionDelay + 200;

      // If last stage, complete pipeline and navigate
      if (index === pipelineStages.length - 1) {
        setTimeout(() => {
          completePipeline();
          router.push("/results");
        }, completionDelay + 500);
      }
    });
  }, [pipelineStages, updateStage, completePipeline, router]);

  useEffect(() => {
    if (isSearching && pipelineStatus === "running") {
      const allIdle = pipelineStages.every((s) => s.status === "idle");
      if (allIdle) {
        runPipeline();
      }
    }
  }, [isSearching, pipelineStatus, pipelineStages, runPipeline]);

  if (pipelineStatus === "idle") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold">AI Pipeline</h3>

      {/* Desktop: horizontal, Mobile: vertical */}
      <div className="flex flex-col gap-3 md:flex-row md:gap-4">
        {pipelineStages.map((stage, index) => {
          const Icon = iconMap[stage.icon] || Compass;
          return (
            <div key={stage.id} className="flex flex-1 items-start gap-3 md:flex-col md:items-center">
              <GlassCard
                className={cn(
                  "w-full p-4 text-center transition-all",
                  stage.status === "running" && "border-highlight/30",
                  stage.status === "complete" && "border-sage/30"
                )}
              >
                <div
                  className={cn(
                    "mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full",
                    stage.status === "idle" && "bg-foreground-muted/10",
                    stage.status === "running" && "bg-highlight/10",
                    stage.status === "complete" && "bg-sage/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      stage.status === "idle" && "text-foreground-muted",
                      stage.status === "running" && "text-highlight",
                      stage.status === "complete" && "text-sage"
                    )}
                  />
                </div>
                <p className="text-sm font-medium">{stage.name}</p>
                <StatusBadge
                  status={stage.status}
                  className="justify-center mt-1"
                />
                {stage.status === "running" && (
                  <Progress value={stage.progress} className="mt-2 h-1" />
                )}
                <p className="mt-1 text-xs text-foreground-muted truncate">
                  {stage.message}
                </p>
              </GlassCard>

              {index < pipelineStages.length - 1 && (
                <div
                  className={cn(
                    "hidden md:block h-px w-4 mt-8 shrink-0",
                    stage.status === "complete"
                      ? "bg-sage/50"
                      : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
