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
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSessions } from "@/hooks/use-sessions";
import type { SessionItem, SessionPipelineStage } from "@/types";

const STAGE_STYLE: Record<
  SessionPipelineStage,
  { icon: typeof MessageSquare; color: string; iconBg: string; borderAccent: string }
> = {
  results: {
    icon: Rocket,
    color: "text-green-500",
    iconBg: "bg-green-500/10",
    borderAccent: "border-l-green-500/50",
  },
  analysis: {
    icon: FileText,
    color: "text-amber-400",
    iconBg: "bg-amber-500/10",
    borderAccent: "border-l-amber-500/50",
  },
  discovery: {
    icon: MessageSquare,
    color: "text-blue-400",
    iconBg: "bg-blue-500/10",
    borderAccent: "border-l-blue-500/50",
  },
};

function SidebarSessionCard({
  session,
  style,
  isActive,
  onSelect,
  onDelete,
  deleteLabel,
  relativeTime,
  moreLabel,
}: {
  session: SessionItem;
  style: (typeof STAGE_STYLE)[SessionPipelineStage];
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  deleteLabel: string;
  relativeTime: string;
  moreLabel: (count: number) => string;
}) {
  const Icon = style.icon;

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
        style.borderAccent,
        isActive
          ? "border-highlight/30 bg-highlight/5"
          : "border-border/40 hover:border-foreground-muted/20 hover:bg-background-secondary/50"
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded",
            style.iconBg
          )}
        >
          <Icon className={cn("h-3 w-3", style.color)} />
        </div>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
          {session.title}
        </span>
        <div className="relative flex shrink-0 items-center">
          <span className="text-[9px] text-foreground-muted/40 transition-opacity group-hover:opacity-0">
            {relativeTime}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={deleteLabel}
            className="absolute inset-0 flex items-center justify-center rounded text-foreground-muted/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {session.pipelineStage === "results" && session.topStartups && session.topStartups.length > 0 ? (
        <div className="flex items-center gap-1 pl-7">
          <Building2 className="h-2.5 w-2.5 shrink-0 text-green-400/50" />
          <span className="truncate text-[10px] text-foreground-muted/50">
            {session.topStartups.slice(0, 2).join(", ")}
            {session.resultCount > 2 && ` ${moreLabel(session.resultCount - 2)}`}
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

  const tHistory = useTranslations("ChatHistory");
  const tTime = useTranslations("RelativeTime");

  const stageOrder: SessionPipelineStage[] = ["results", "analysis", "discovery"];

  const stageLabels: Record<SessionPipelineStage, string> = {
    results: tHistory("results"),
    analysis: tHistory("analysis"),
    discovery: tHistory("discovery"),
  };

  function getRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return tTime("now");
    if (diffMins < 60) return tTime("minutesAgo", { minutes: diffMins });
    if (diffHours < 24) return tTime("hoursAgo", { hours: diffHours });
    if (diffDays === 1) return tTime("yesterday");
    if (diffDays < 7) return tTime("daysAgo", { days: diffDays });
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  const grouped = useMemo(() => {
    return stageOrder
      .map((stage) => {
        const items = sessions
          .filter((s) => s.pipelineStage === stage)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        return { stage, sessions: items };
      })
      .filter((g) => g.sessions.length > 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-6 text-center">
        <LogIn className="h-5 w-5 text-foreground-muted/50" />
        <p className="text-xs text-foreground-muted/50">
          {tHistory("loginToSeeHistory")}
        </p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
        <p className="text-xs text-foreground-muted/50">{tHistory("noChatsYet")}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-2 pt-2">
      {grouped.map((group) => {
        const style = STAGE_STYLE[group.stage];
        const StageIcon = style.icon;
        return (
          <div key={group.stage} className="mb-3">
            <div className="mb-1.5 flex items-center gap-1.5 px-1">
              <StageIcon className={cn("h-3 w-3", style.color)} />
              <p className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted/50">
                {stageLabels[group.stage]}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              {group.sessions.map((session) => (
                <SidebarSessionCard
                  key={session.id}
                  session={session}
                  style={style}
                  isActive={session.id === currentSessionId}
                  onSelect={() => handleSelect(session.id)}
                  onDelete={() => deleteSession(session.id)}
                  deleteLabel={tHistory("deleteSession", { title: session.title })}
                  relativeTime={getRelativeTime(session.updatedAt)}
                  moreLabel={(count) => tHistory("moreStartups", { count })}
                />
              ))}
            </div>
          </div>
        );
      })}
    </ScrollArea>
  );
}
