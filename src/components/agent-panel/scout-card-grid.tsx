"use client";

import { motion } from "motion/react";
import { cardStagger } from "@/lib/motion";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { CompanyCard } from "@/components/shared/company-card";

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
          <CompanyCard key={card.id} mode="search" company={card} />
        ))}
      </motion.div>
    </div>
  );
}
