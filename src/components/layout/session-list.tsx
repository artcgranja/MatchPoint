"use client";

import { useEffect, useState, useCallback } from "react";
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

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupSessions(sessions: SessionItem[]): GroupedSessions[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, SessionItem[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Older: [],
  };

  for (const session of sessions) {
    const date = new Date(session.updatedAt);
    if (date >= today) {
      groups.Today.push(session);
    } else if (date >= yesterday) {
      groups.Yesterday.push(session);
    } else if (date >= weekAgo) {
      groups["Previous 7 days"].push(session);
    } else {
      groups.Older.push(session);
    }
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, sessions]) => ({ label, sessions }));
}

export function SessionList() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const currentSessionId = useDiscoveryStore((s) => s.sessionId);
  const setSessionId = useDiscoveryStore((s) => s.setSessionId);
  const resetDiscovery = useDiscoveryStore((s) => s.reset);
  const resetPanel = useAgentPanelStore((s) => s.reset);
  const resetPipeline = useSearchStore((s) => s.resetPipeline);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/v1/sessions");
      if (res.ok) {
        const data: SessionItem[] = await res.json();
        setSessions(data);
      }
    } catch {
      // Silently fail
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, currentSessionId]);

  const handleSelect = (sessionId: string) => {
    if (sessionId === currentSessionId) return;
    resetDiscovery();
    resetPanel();
    resetPipeline();
    setSessionId(sessionId);
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
    } catch {
      // Silently fail
    }
  };

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-6 text-center">
        <LogIn className="h-5 w-5 text-foreground-muted/50" />
        <p className="text-xs text-foreground-muted/50">
          Sign in to see chat history
        </p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
        <p className="text-xs text-foreground-muted/50">No chats yet</p>
      </div>
    );
  }

  const grouped = groupSessions(sessions);

  return (
    <ScrollArea className="flex-1 px-2 pt-2">
      {grouped.map((group) => (
        <div key={group.label} className="mb-3">
          <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-foreground-muted/50">
            {group.label}
          </p>
          {group.sessions.map((session) => (
            <div
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(session.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSelect(session.id); }}
              onMouseEnter={() => setHoveredId(session.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                "group flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                session.id === currentSessionId
                  ? "bg-highlight/10 text-highlight"
                  : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
              )}
            >
              {session.hasResults ? (
                <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500" />
              ) : (
                <MessageSquare className="h-3 w-3 shrink-0" />
              )}
              <span className="min-w-0 flex-1 truncate text-xs">
                {session.title}
              </span>
              {hoveredId === session.id ? (
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  className="shrink-0 rounded p-0.5 text-foreground-muted/50 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              ) : (
                <span className="shrink-0 text-[10px] text-foreground-muted/40">
                  {getRelativeTime(session.updatedAt)}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </ScrollArea>
  );
}
