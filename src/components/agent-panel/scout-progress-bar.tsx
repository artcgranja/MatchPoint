"use client";

import { motion } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { useAgentPanelStore } from "@/stores/agent-panel-store";

export function ScoutProgressBar() {
  const { scoutStatus, scoutProgress, scoutMessage } = useAgentPanelStore();

  if (scoutStatus === "idle") return null;

  return (
    <div className="space-y-1.5 px-4 pt-4">
      <div className="h-1 overflow-hidden rounded-full bg-background-secondary">
        <motion.div
          className="h-full rounded-full bg-highlight"
          initial={{ width: 0 }}
          animate={{ width: `${scoutProgress}%` }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        />
      </div>
      {scoutMessage && (
        <p className="text-xs text-foreground-muted">{scoutMessage}</p>
      )}
    </div>
  );
}
