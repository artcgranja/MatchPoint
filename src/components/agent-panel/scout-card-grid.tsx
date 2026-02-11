"use client";

import { motion } from "motion/react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { cardStagger } from "@/lib/motion";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { StartupCard } from "@/components/discovery/startup-card";

export function ScoutCardGrid() {
  const { cards, scoutSummary } = useAgentPanelStore();

  if (cards.length === 0) return null;

  return (
    <div className="px-4 pb-4 pt-3">
      {scoutSummary && (
        <div className="prose prose-sm prose-invert mb-3 max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed">
          <Streamdown plugins={{ code }} isAnimating={false}>
            {scoutSummary}
          </Streamdown>
        </div>
      )}

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
