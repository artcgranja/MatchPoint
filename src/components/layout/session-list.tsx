"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Trash2, MessageSquare, CheckCircle2, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/stores/auth-store";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { useSearchStore } from "@/stores/search-store";

interface SessionItem {
  id: string;
  title: string;
  currentStage: string;
  isComplete: boolean;
  hasResults: boolean;
  resultCount: number;
  createdAt: string;
  updatedAt: string;
}

interface GroupedSessions {
  label: string;
  sessions: SessionItem[];
}

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

function groupSessions(sessions: SessionItem[]): GroupedSessions[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, SessionItem[]> = {
    Hoje: [],
    Ontem: [],
    "Últimos 7 dias": [],
    Anteriores: [],
  };

  for (const session of sessions) {
    const date = new Date(session.updatedAt);
    if (date >= today) {
      groups.Hoje.push(session);
    } else if (date >= yesterday) {
      groups.Ontem.push(session);
    } else if (date >= weekAgo) {
      groups["Últimos 7 dias"].push(session);
    } else {
      groups.Anteriores.push(session);
    }
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, sessions]) => ({ label, sessions }));
}

export function SessionList() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const currentSessionId = useDiscoveryStore((s) => s.sessionId);
  const setSessionId = useDiscoveryStore((s) => s.setSessionId);
  const setIsLoadingSession = useDiscoveryStore((s) => s.setIsLoadingSession);
  const resetDiscovery = useDiscoveryStore((s) => s.reset);
  const resetPanel = useAgentPanelStore((s) => s.reset);
  const resetPipeline = useSearchStore((s) => s.resetPipeline);

  const prevSessionIdRef = useRef(currentSessionId);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/v1/sessions");
      if (res.ok) {
        const data: SessionItem[] = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  }, [user]);

  // Fetch on mount and when a new session is created (null → value)
  useEffect(() => {
    const prev = prevSessionIdRef.current;
    prevSessionIdRef.current = currentSessionId;

    if (prev === null && currentSessionId !== null) {
      fetchSessions();
    }
  }, [currentSessionId, fetchSessions]);

  // Initial fetch on mount
  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSelect = (sessionId: string) => {
    if (sessionId === currentSessionId) return;
    resetDiscovery();
    resetPanel();
    resetPipeline();
    setIsLoadingSession(true);
    setSessionId(sessionId);
    if (pathname !== "/") router.push("/");
  };

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (sessionId === currentSessionId) {
          resetDiscovery();
          resetPanel();
          resetPipeline();
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

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

  const grouped = groupSessions(sessions);

  return (
    <ScrollArea className="flex-1 px-2 pt-2">
      {grouped.map((group) => (
        <div key={group.label} className="mb-3">
          <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-foreground-muted/50">
            {group.label}
          </p>
          {group.sessions.map((session) => (
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
              {session.hasResults ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              ) : (
                <MessageSquare className="h-4 w-4 shrink-0" />
              )}
              <span className="min-w-0 flex-1 truncate">
                {session.title}
              </span>
              {/* Right area: timestamp + delete occupy same space via absolute overlay */}
              <div className="relative flex shrink-0 items-center">
                <span className="text-[10px] text-foreground-muted/40 transition-opacity group-hover:opacity-0">
                  {getRelativeTime(session.updatedAt)}
                </span>
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  aria-label={`Excluir sessão: ${session.title}`}
                  className="absolute inset-0 flex items-center justify-center rounded text-foreground-muted/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </ScrollArea>
  );
}
