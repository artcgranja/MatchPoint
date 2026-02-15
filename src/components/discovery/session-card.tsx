"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Trash2,
  Building2,
  MoreVertical,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cardEntrance } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StartupDetailDialog } from "./startup-detail-dialog";
import { apiGet } from "@/lib/api/client";
import { STAGE_CONFIG } from "@/lib/stage-config";
import type { SessionItem, StartupCard } from "@/types";

// --- Preview components (rendered inside the top area) ---

function DiscoveryPreview({ preview }: { preview: string | null }) {
  if (!preview) return null;
  return (
    <p className="line-clamp-4 text-xs leading-relaxed text-foreground-muted/70">
      {preview}
    </p>
  );
}

function AnalysisPreview({ preview }: { preview: string | null }) {
  if (!preview) return null;
  return (
    <p className="line-clamp-4 text-xs leading-relaxed text-foreground-muted/70">
      {preview}
    </p>
  );
}

function ScoutPreview({
  topStartups,
  resultCount,
  onStartupClick,
}: {
  topStartups: string[] | null;
  resultCount: number;
  onStartupClick?: (name: string) => void;
}) {
  if (!topStartups || topStartups.length === 0) return null;
  const remaining = resultCount - topStartups.length;

  return (
    <div className="flex flex-col gap-1.5">
      {topStartups.map((name) => (
        <button
          key={name}
          onClick={(e) => {
            e.stopPropagation();
            onStartupClick?.(name);
          }}
          className="flex items-center gap-2 text-left hover:bg-white/5 rounded px-1.5 py-1 -mx-1.5 transition-colors"
        >
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/10">
            <Building2 className="h-3 w-3 text-green-400/70" />
          </div>
          <span className="truncate text-xs text-foreground-muted/70">
            {name}
          </span>
        </button>
      ))}
      {remaining > 0 && (
        <span className="pl-7 text-[10px] text-foreground-muted/40">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

// --- Main card ---

interface SessionCardProps {
  session: SessionItem;
  isActive?: boolean;
  onClick: () => void;
  relativeTime: string;
  onDelete?: () => void;
  onRename?: () => void;
  deleteLabel?: string;
  renameLabel?: string;
  resultCountLabel?: string;
  moreLabel?: (count: number) => string;
}

export function SessionCard({
  session,
  isActive = false,
  onClick,
  onDelete,
  onRename,
  deleteLabel,
  renameLabel,
  resultCountLabel,
  relativeTime,
}: SessionCardProps) {
  const config = STAGE_CONFIG[session.pipelineStage];
  const Icon = config.icon;
  const [selectedCard, setSelectedCard] = useState<StartupCard | null>(null);
  const [isLoadingCard, setIsLoadingCard] = useState(false);

  const hasActions = onDelete && onRename;

  const handleStartupClick = async (startupName: string) => {
    if (!session.searchExecutionId || isLoadingCard) return;

    setIsLoadingCard(true);
    try {
      const searchData = await apiGet<{ cards: StartupCard[] }>(
        `/searches/${session.searchExecutionId}`
      );
      const card = searchData.cards.find((c) => c.name === startupName);
      if (card) {
        setSelectedCard(card);
      }
    } catch (error) {
      console.error("Failed to fetch startup details:", error);
    } finally {
      setIsLoadingCard(false);
    }
  };

  return (
    <>
      <motion.div
        variants={cardEntrance}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClick();
        }}
        className={cn(
          "group relative flex h-[180px] cursor-pointer flex-col overflow-hidden rounded-xl border border-border-highlight bg-background-tertiary transition-colors duration-200 hover:border-border-hover hover:bg-background-secondary",
          isActive && "border-highlight/30 bg-highlight/5"
        )}
      >
          {/* Top: Preview area (fixed height, takes remaining space) */}
          <div className="flex-1 overflow-hidden px-3.5 pt-3.5 pb-2">
            {session.pipelineStage === "results" ? (
              <ScoutPreview
                topStartups={session.topStartups}
                resultCount={session.resultCount}
                onStartupClick={handleStartupClick}
              />
            ) : session.pipelineStage === "analysis" ? (
              <AnalysisPreview preview={session.analysisPreview} />
            ) : (
              <DiscoveryPreview preview={session.preview} />
            )}

            {/* Result count badge inside preview area */}
            {session.pipelineStage === "results" && session.resultCount > 0 && resultCountLabel && (
              <div className="mt-1.5">
                <Badge
                  variant="secondary"
                  className="text-[10px] text-green-400/80"
                >
                  {resultCountLabel}
                </Badge>
              </div>
            )}
          </div>

          {/* Bottom: Stage icon + title + timestamp + actions */}
          <div className="flex items-center gap-2.5 border-t border-border/40 px-3.5 py-2.5">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                config.iconBg
              )}
            >
              <Icon className={cn("h-3 w-3", config.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-1 text-xs font-medium text-foreground">
                {session.title}
              </h4>
              <span className="text-[10px] text-foreground-muted/40">
                {relativeTime}
              </span>
            </div>
            {hasActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Session actions"
                    className="shrink-0 rounded p-0.5 text-foreground-muted/30 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onRename!();
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    {renameLabel}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete!();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleteLabel}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
      </motion.div>

      {selectedCard && (
        <StartupDetailDialog
          card={selectedCard}
          open={!!selectedCard}
          onOpenChange={(open) => {
            if (!open) setSelectedCard(null);
          }}
        />
      )}
    </>
  );
}
