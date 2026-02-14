"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { MapPin, ExternalLink } from "lucide-react";
import { cardEntrance } from "@/lib/motion";
import { SaveButton } from "@/components/saved/save-button";
import { ConnectButton } from "@/components/connections/connect-button";
import { StartupDetailDialog } from "./startup-detail-dialog";
import type { StartupCard as StartupCardType } from "@/types";

interface StartupCardProps {
  card: StartupCardType;
}

export function StartupCard({ card }: StartupCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty(
        "--mouse-x",
        `${e.clientX - rect.left}px`
      );
      e.currentTarget.style.setProperty(
        "--mouse-y",
        `${e.clientY - rect.top}px`
      );
    },
    []
  );

  return (
    <>
      <motion.div
        variants={cardEntrance}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onMouseMove={handleMouseMove}
        onClick={() => setDetailOpen(true)}
        className="spotlight-card glass relative rounded-xl border border-border p-4 space-y-2.5 cursor-pointer transition-colors duration-200 hover:border-border-hover hover:bg-surface-hover"
      >
        <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5">
          <ConnectButton companyId={card.id} />
          <SaveButton companyId={card.id} size="sm" />
        </div>

        {/* Header: Name + Batch Badge */}
        <div className="flex items-start justify-between gap-3 pr-6">
          <div className="min-w-0">
            <h4 className="font-semibold text-sm truncate text-foreground">
              {card.name}
            </h4>
            <p className="text-xs text-foreground-muted truncate mt-0.5">
              {card.oneLiner}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0 rounded-full bg-highlight/10 border border-highlight/20 px-2 py-0.5">
            <ExternalLink className="h-3 w-3 text-highlight" />
            <span className="text-[10px] font-medium text-highlight">
              {card.batch}
            </span>
          </div>
        </div>

        {/* Body: Why Relevant */}
        <p className="text-xs text-foreground-muted leading-relaxed line-clamp-3">
          {card.whyRelevant}
        </p>

        {/* Divider */}
        <div className="h-px bg-divider" />

        {/* Footer: Tags + Location */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {card.industries.slice(0, 2).map((industry) => (
              <span
                key={industry}
                className="rounded-md bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-foreground-muted border border-border"
              >
                {industry}
              </span>
            ))}
            {card.industries.length > 2 && (
              <span className="text-[10px] text-foreground-muted/50 self-center">
                +{card.industries.length - 2}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-foreground-muted/60">
            <MapPin className="h-3 w-3" />
            <span className="text-[11px]">{card.location}</span>
          </div>
        </div>
      </motion.div>

      <StartupDetailDialog
        card={card}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
