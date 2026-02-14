"use client";

import { MapPin, ExternalLink, Sparkles, Tag } from "lucide-react";
import { SaveButton } from "@/components/saved/save-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { StartupCard } from "@/types";

interface StartupDetailDialogProps {
  card: StartupCard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartupDetailDialog({
  card,
  open,
  onOpenChange,
}: StartupDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background-secondary border-border-prominent">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="font-heading text-lg text-foreground">
                  {card.name}
                </DialogTitle>
                <SaveButton companyId={card.id} size="sm" />
              </div>
              <DialogDescription className="mt-1 text-sm text-foreground-muted">
                {card.oneLiner}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1 shrink-0 rounded-full bg-highlight/10 border border-highlight/20 px-2.5 py-1">
              <ExternalLink className="h-3.5 w-3.5 text-highlight" />
              <span className="text-xs font-medium text-highlight">
                {card.batch}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-highlight" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Por que é relevante
            </h4>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 rounded-lg bg-highlight/5 border border-highlight/10 p-3">
            {card.whyRelevant}
          </p>
        </div>

        <Separator className="bg-divider" />

        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Industrias
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {card.industries.map((industry) => (
              <span
                key={industry}
                className="rounded-md bg-surface-elevated px-2.5 py-1 text-xs font-medium text-foreground-muted border border-border"
              >
                {industry}
              </span>
            ))}
          </div>
        </div>

        {card.tags.length > 0 && (
          <>
            <Separator className="bg-divider" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-foreground-muted" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Tags
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-surface-elevated px-2.5 py-1 text-xs font-medium text-foreground-muted border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator className="bg-divider" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-foreground-muted">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-sm">{card.location}</span>
          </div>
          <div className="flex items-center gap-3">
            {card.website && (
              <a
                href={card.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-highlight hover:underline"
              >
                Website
              </a>
            )}
            {card.ycUrl && (
              <a
                href={card.ycUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-highlight hover:underline"
              >
                YC Profile
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
