"use client";

import {
  MessageSquare,
  FileText,
  Rocket,
  Trash2,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { SessionItem, SessionPipelineStage } from "@/types";

const STAGE_CONFIG: Record<
  SessionPipelineStage,
  {
    label: string;
    icon: typeof MessageSquare;
    color: string;
    iconBg: string;
    borderAccent: string;
  }
> = {
  discovery: {
    label: "Descoberta",
    icon: MessageSquare,
    color: "text-blue-400",
    iconBg: "bg-blue-500/10",
    borderAccent: "border-l-blue-500/50",
  },
  analysis: {
    label: "Análise",
    icon: FileText,
    color: "text-amber-400",
    iconBg: "bg-amber-500/10",
    borderAccent: "border-l-amber-500/50",
  },
  results: {
    label: "Scout",
    icon: Rocket,
    color: "text-green-400",
    iconBg: "bg-green-500/10",
    borderAccent: "border-l-green-500/50",
  },
};

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
}

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
}: {
  topStartups: string[] | null;
  resultCount: number;
}) {
  if (!topStartups || topStartups.length === 0) return null;
  const remaining = resultCount - topStartups.length;

  return (
    <div className="flex flex-col gap-1.5">
      {topStartups.map((name) => (
        <div key={name} className="flex items-center gap-2">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/10">
            <Building2 className="h-3 w-3 text-green-400/70" />
          </div>
          <span className="truncate text-xs text-foreground-muted/70">
            {name}
          </span>
        </div>
      ))}
      {remaining > 0 && (
        <span className="pl-7 text-[10px] text-foreground-muted/40">
          +{remaining} mais
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
}

export function SessionCard({
  session,
  isActive,
  onClick,
  onDelete,
}: SessionCardProps) {
  const config = STAGE_CONFIG[session.pipelineStage];
  const Icon = config.icon;

  return (
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
            {getRelativeTime(session.updatedAt)}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Excluir: ${session.title}`}
          className="shrink-0 rounded p-0.5 text-foreground-muted/30 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Stage-specific preview */}
      {session.pipelineStage === "results" ? (
        <ScoutPreview
          topStartups={session.topStartups}
          resultCount={session.resultCount}
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
            {session.resultCount} resultado
            {session.resultCount !== 1 ? "s" : ""}
          </Badge>
        </div>
      )}
    </div>
  );
}
