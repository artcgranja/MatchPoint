"use client";

import { useState } from "react";
import {
  Trash2,
  Building2,
  MoreVertical,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import type { SessionItem, SessionPipelineStage, StartupCard } from "@/types";

function DiscoveryPreview({ preview }: { preview: string | null }) {
  if (!preview) return null;
  return (
    <p className="line-clamp-2 text-xs leading-relaxed text-foreground-muted/60">
      {preview}
    </p>
  );
}

function AnalysisPreview({ preview }: { preview: string | null }) {
  if (!preview) return null;
  return (
    <div className="rounded-lg border border-amber-500/10 bg-amber-500/[0.03] px-3 py-2">
      <p className="line-clamp-2 text-xs leading-relaxed text-foreground-muted/60">
        {preview}
      </p>
    </div>
  );
}

function ScoutPreview({
  topStartups,
  resultCount,
  moreLabel,
  searchExecutionId,
  onStartupClick,
}: {
  topStartups: string[] | null;
  resultCount: number;
  moreLabel: (count: number) => string;
  searchExecutionId: string | null;
  onStartupClick: (name: string) => void;
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
            onStartupClick(name);
          }}
          className="flex items-center gap-2 text-left hover:bg-surface-hover/50 rounded px-1 py-0.5 -mx-1 transition-colors"
        >
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/10">
            <Building2 className="h-3 w-3 text-green-400/70" />
          </div>
          <span className="truncate text-xs text-foreground-muted/70 group-hover:text-foreground-muted">
            {name}
          </span>
        </button>
      ))}
      {remaining > 0 && (
        <span className="pl-7 text-[10px] text-foreground-muted/40">
          {moreLabel(remaining)}
        </span>
      )}
    </div>
  );
}

interface SessionCardProps {
  session: SessionItem;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onRename: () => void;
  deleteLabel: string;
  renameLabel: string;
  resultCountLabel: string;
  relativeTime: string;
  moreLabel: (count: number) => string;
}

export function SessionCard({
  session,
  isActive,
  onClick,
  onDelete,
  onRename,
  deleteLabel,
  renameLabel,
  resultCountLabel,
  relativeTime,
  moreLabel,
}: SessionCardProps) {
  const config = STAGE_CONFIG[session.pipelineStage];
  const Icon = config.icon;
  const [selectedCard, setSelectedCard] = useState<StartupCard | null>(null);
  const [isLoadingCard, setIsLoadingCard] = useState(false);

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
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-2.5 rounded-xl border border-l-2 p-3.5 transition-all",
        config.borderAccent,
        isActive
          ? "border-highlight/30 bg-highlight/5"
          : "border-border/60 hover:border-foreground-muted/20 hover:bg-background-secondary/50"
      )}
    >
      {/* Header: icon + title + time + delete */}
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            config.iconBg
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", config.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-1 text-sm font-medium text-foreground">
            {session.title}
          </h4>
          <span className="text-[10px] text-foreground-muted/40">
            {relativeTime}
          </span>
        </div>
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
                onRename();
              }}
            >
              <Pencil className="h-4 w-4" />
              {renameLabel}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
              {deleteLabel}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stage-specific preview */}
      {session.pipelineStage === "results" ? (
        <ScoutPreview
          topStartups={session.topStartups}
          resultCount={session.resultCount}
          moreLabel={moreLabel}
          searchExecutionId={session.searchExecutionId}
          onStartupClick={handleStartupClick}
        />
      ) : session.pipelineStage === "analysis" ? (
        <AnalysisPreview preview={session.analysisPreview} />
      ) : (
        <DiscoveryPreview preview={session.preview} />
      )}

      {/* Footer: result count badge (only for scout) */}
      {session.pipelineStage === "results" && session.resultCount > 0 && (
        <div className="flex items-center">
          <Badge
            variant="secondary"
            className="text-[10px] text-green-400/80"
          >
            {resultCountLabel}
          </Badge>
        </div>
      )}
    </div>

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
