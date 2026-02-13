"use client";

import { useMemo } from "react";
import {
  Trash2,
  MessageSquare,
  Rocket,
  FileText,
  LogIn,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSessions } from "@/hooks/use-sessions";
import type { SessionItem, SessionPipelineStage } from "@/types";

const STAGE_GROUPS: {
  stage: SessionPipelineStage;
  label: string;
  icon: typeof MessageSquare;
  color: string;
  iconBg: string;
  borderAccent: string;
}[] = [
  {
    stage: "results",
    label: "Scout",
    icon: Rocket,
    color: "text-green-500",
    iconBg: "bg-green-500/10",
    borderAccent: "border-l-green-500/50",
  },
  {
    stage: "analysis",
    label: "Análise",
    icon: FileText,
    color: "text-amber-400",
    iconBg: "bg-amber-500/10",
    borderAccent: "border-l-amber-500/50",
  },
  {
    stage: "discovery",
    label: "Descoberta",
    icon: MessageSquare,
    color: "text-blue-400",
    iconBg: "bg-blue-500/10",
    borderAccent: "border-l-blue-500/50",
  },
];

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

function groupByStage(sessions: SessionItem[]) {
  return STAGE_GROUPS.map((group) => {
    const items = sessions
      .filter((s) => s.pipelineStage === group.stage)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return { ...group, sessions: items };
  }).filter((g) => g.sessions.length > 0);
}

function SidebarSessionCard({
  session,
  group,
  isActive,
  onSelect,
  onDelete,
}: {
  session: SessionItem;
  group: (typeof STAGE_GROUPS)[number];
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const Icon = group.icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      className={cn(
        "group flex w-full cursor-pointer flex-col gap-1.5 rounded-lg border border-l-2 p-2.5 transition-all",
        group.borderAccent,
        isActive
          ? "border-highlight/30 bg-highlight/5"
          : "border-border/40 hover:border-foreground-muted/20 hover:bg-background-secondary/50"
      )}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded",
            group.iconBg
          )}
        >
          <Icon className={cn("h-3 w-3", group.color)} />
        </div>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
          {session.title}
        </span>
        <div className="relative flex shrink-0 items-center">
          <span className="text-[9px] text-foreground-muted/40 transition-opacity group-hover:opacity-0">
            {getRelativeTime(session.updatedAt)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Excluir sessão: ${session.title}`}
            className="absolute inset-0 flex items-center justify-center rounded text-foreground-muted/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Stage-specific mini preview */}
      {session.pipelineStage === "results" && session.topStartups && session.topStartups.length > 0 ? (
        <div className="flex items-center gap-1 pl-7">
          <Building2 className="h-2.5 w-2.5 shrink-0 text-green-400/50" />
          <span className="truncate text-[10px] text-foreground-muted/50">
            {session.topStartups.slice(0, 2).join(", ")}
            {session.resultCount > 2 && ` +${session.resultCount - 2}`}
          </span>
        </div>
      ) : session.pipelineStage === "analysis" && session.analysisPreview ? (
        <p className="line-clamp-1 pl-7 text-[10px] text-foreground-muted/50">
          {session.analysisPreview}
        </p>
      ) : session.preview ? (
        <p className="line-clamp-1 pl-7 text-[10px] text-foreground-muted/50">
          {session.preview}
        </p>
      ) : null}
    </div>
  );
}

export function SessionList() {
  const {
    sessions,
    user,
    currentSessionId,
    handleSelect,
    deleteSession,
  } = useSessions();

  const grouped = useMemo(() => groupByStage(sessions), [sessions]);

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-6 text-center">
        <LogIn className="h-5 w-5 text-foreground-muted/50" />
        <p className="text-xs text-foreground-muted/50">
          Entre para ver seu histórico
        </p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
        <p className="text-xs text-foreground-muted/50">Nenhuma execução ainda</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-2 pt-2">
      {grouped.map((group) => (
        <div key={group.stage} className="mb-3">
          <div className="mb-1.5 flex items-center gap-1.5 px-1">
            <group.icon className={cn("h-3 w-3", group.color)} />
            <p className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted/50">
              {group.label}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {group.sessions.map((session) => (
              <SidebarSessionCard
                key={session.id}
                session={session}
                group={group}
                isActive={session.id === currentSessionId}
                onSelect={() => handleSelect(session.id)}
                onDelete={() => deleteSession(session.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </ScrollArea>
  );
}
