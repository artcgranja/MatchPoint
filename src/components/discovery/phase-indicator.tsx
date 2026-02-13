"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import type { SessionStage, AgentPanelTab } from "@/types";

const STAGES: { key: SessionStage; labelKey: "discovery" | "analysis" | "scout"; panelTab?: AgentPanelTab }[] = [
  { key: "discovery", labelKey: "discovery" },
  { key: "analysis", labelKey: "analysis", panelTab: "analysis" },
  { key: "scout", labelKey: "scout", panelTab: "scout" },
];

const STAGE_ORDER: SessionStage[] = ["discovery", "analysis", "scout", "complete", "advising"];

interface StageIndicatorProps {
  currentStage: SessionStage;
}

export function StageIndicator({ currentStage }: StageIndicatorProps) {
  const t = useTranslations("Stages");
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const { analysisStatus, scoutStatus, setPanelOpen, setActiveTab } =
    useAgentPanelStore();

  const hasData = (stage: SessionStage) => {
    if (stage === "analysis") return analysisStatus !== "idle";
    if (stage === "scout") return scoutStatus !== "idle";
    return false;
  };

  const handleClick = (stage: (typeof STAGES)[number]) => {
    if (!stage.panelTab) return;
    const stageIdx = STAGE_ORDER.indexOf(stage.key);
    // Only clickable if current or past and has data
    if (stageIdx <= currentIdx && hasData(stage.key)) {
      setPanelOpen(true);
      setActiveTab(stage.panelTab);
    }
  };

  return (
    <div className="flex items-center gap-1 rounded-lg bg-background-secondary/50 p-1">
      {STAGES.map((stage) => {
        const stageIdx = STAGE_ORDER.indexOf(stage.key);
        const isCurrent = stage.key === currentStage;
        const isPast = stageIdx < currentIdx;
        const clickable = stage.panelTab && stageIdx <= currentIdx && hasData(stage.key);

        return (
          <button
            key={stage.key}
            disabled={!clickable}
            onClick={() => handleClick(stage)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-300",
              isCurrent &&
                "bg-highlight/15 text-highlight shadow-[0_0_12px_rgba(59,130,246,0.15)]",
              isPast && "text-foreground-muted",
              !isCurrent && !isPast && "text-foreground-muted/40",
              clickable && "cursor-pointer hover:bg-background-secondary/80",
              !clickable && "cursor-default"
            )}
          >
            {t(stage.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
