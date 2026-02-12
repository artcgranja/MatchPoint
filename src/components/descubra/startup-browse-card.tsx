"use client";

import { useCallback } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { MapPin, ExternalLink, Users } from "lucide-react";
import { cardEntrance } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import type { BrowseCompany } from "@/types";

interface StartupBrowseCardProps {
  company: BrowseCompany;
}

export function StartupBrowseCard({ company }: StartupBrowseCardProps) {
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
    <Link href={`/descubra/${company.id}`}>
      <motion.div
        variants={cardEntrance}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onMouseMove={handleMouseMove}
        className="spotlight-card glass rounded-xl border border-border p-4 space-y-3 cursor-pointer transition-colors duration-200 hover:border-border-hover hover:bg-surface-hover h-full"
      >
        {/* Header: Logo + Name + Batch */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {company.smallLogoUrl && (
              <img
                src={company.smallLogoUrl}
                alt={company.name}
                className="h-8 w-8 shrink-0 rounded-md object-contain bg-white/5"
              />
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate text-foreground">
                {company.name}
              </h3>
              <p className="text-xs text-foreground-muted truncate mt-0.5">
                {company.oneLiner}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 rounded-full bg-highlight/10 border border-highlight/20 px-2 py-0.5">
            <ExternalLink className="h-3 w-3 text-highlight" />
            <span className="text-[10px] font-medium text-highlight">
              {company.batch}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-foreground-muted leading-relaxed line-clamp-3">
          {company.longDescription}
        </p>

        {/* Divider */}
        <div className="h-px bg-divider" />

        {/* Footer: Tags + Metadata */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 min-w-0">
            {company.industries.slice(0, 2).map((industry) => (
              <span
                key={industry}
                className="rounded-md bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-foreground-muted border border-border"
              >
                {industry}
              </span>
            ))}
            {company.industries.length > 2 && (
              <span className="text-[10px] text-foreground-muted/50 self-center">
                +{company.industries.length - 2}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 text-foreground-muted/60">
              <Users className="h-3 w-3" />
              <span className="text-[11px]">{company.teamSize}</span>
            </div>
            <div className="flex items-center gap-1 text-foreground-muted/60">
              <MapPin className="h-3 w-3" />
              <span className="text-[11px] truncate max-w-[80px]">
                {company.allLocations}
              </span>
            </div>
          </div>
        </div>

        {/* Status / Stage badges */}
        <div className="flex items-center gap-1.5">
          {company.status === "Active" && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-green-500/30 text-green-400"
            >
              Ativa
            </Badge>
          )}
          {company.stage && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-border text-foreground-muted"
            >
              {company.stage}
            </Badge>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
