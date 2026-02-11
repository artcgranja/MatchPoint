"use client";

import { motion } from "motion/react";
import { staggerContainer } from "@/lib/motion";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { ToolCallItem } from "./tool-call-item";

export function ToolCallLog() {
  const { toolCalls } = useAgentPanelStore();

  if (toolCalls.length === 0) return null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-2 px-4 pt-3"
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted/60">
        Acoes do Agente
      </p>
      {toolCalls.map((tc) => (
        <ToolCallItem key={tc.id} toolCall={tc} />
      ))}
    </motion.div>
  );
}
