"use client";

import { motion } from "motion/react";
import { cardStagger } from "@/lib/motion";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { StartupCard } from "@/components/discovery/startup-card";

export function ScoutCardGrid() {
  const { cards } = useAgentPanelStore();

  if (cards.length === 0) return null;

  return (
    <div className="px-4 pb-4 pt-3">
      <motion.div
        variants={cardStagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-3"
      >
        {cards.map((card) => (
          <StartupCard key={card.id} card={card} />
        ))}
      </motion.div>
    </div>
  );
}
