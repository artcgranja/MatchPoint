"use client";

import { Trash2, MessageSquare, Rocket, FileText, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSessions } from "@/hooks/use-sessions";
import type { SessionItem, SessionPipelineStage } from "@/types";

const STAGE_GROUPS: {
  stage: SessionPipelineStage;
  label: string;
  icon: typeof MessageSquare;
  color: string;
}[] = [
  { stage: "results", label: "Resultados", icon: Rocket, color: "text-green-500" },
  { stage: "analysis", label: "Análise", icon: FileText, color: "text-amber-400" },
  { stage: "discovery", label: "Descoberta", icon: MessageSquare, color: "text-blue-400" },
];

const STAGE_ICON_MAP: Record<SessionPipelineStage, { icon: typeof MessageSquare; color: string }> = {
  discovery: { icon: MessageSquare, color: "text-blue-400" },
  analysis: { icon: FileText, color: "text-amber-400" },
  results: { icon: Rocket, color: "text-green-500" },
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

function groupByStage(sessions: SessionItem[]) {
  return STAGE_GROUPS.map((group) => {
    const items = sessions
      .filter((s) => s.pipelineStage === group.stage)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return { ...group, sessions: items };
  }).filter((g) => g.sessions.length > 0);
}

export function SessionList() {
  const {
    sessions,
    user,
    currentSessionId,
    handleSelect,
    deleteSession,
  } = useSessions();

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
        <p className="text-xs text-foreground-muted/50">Nenhum chat ainda</p>
      </div>
    );
  }

  const grouped = groupByStage(sessions);

  return (
    <ScrollArea className="flex-1 px-2 pt-2">
      {grouped.map((group) => (
        <div key={group.stage} className="mb-3">
          <div className="mb-1 flex items-center gap-1.5 px-3">
            <group.icon className={cn("h-3 w-3", group.color)} />
            <p className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted/50">
              {group.label}
            </p>
          </div>
          {group.sessions.map((session) => {
            const stageIcon = STAGE_ICON_MAP[session.pipelineStage];
            const Icon = stageIcon.icon;
            return (
              <div
                key={session.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(session.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSelect(session.id); }}
                className={cn(
                  "group flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  session.id === currentSessionId
                    ? "bg-highlight/10 text-highlight"
                    : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", stageIcon.color)} />
                <span className="min-w-0 flex-1 truncate">
                  {session.title}
                </span>
                <div className="relative flex shrink-0 items-center">
                  <span className="text-[10px] text-foreground-muted/40 transition-opacity group-hover:opacity-0">
                    {getRelativeTime(session.updatedAt)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    aria-label={`Excluir sessão: ${session.title}`}
                    className="absolute inset-0 flex items-center justify-center rounded text-foreground-muted/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </ScrollArea>
  );
}
