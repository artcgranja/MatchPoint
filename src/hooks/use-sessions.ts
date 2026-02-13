"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SessionItem } from "@/types";
import { useAuthStore } from "@/stores/auth-store";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { useSearchStore } from "@/stores/search-store";

export function useSessions() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/sessions");
      if (res.ok) {
        const data: SessionItem[] = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch when a new session is created (null → value)
  useEffect(() => {
    const prev = prevSessionIdRef.current;
    prevSessionIdRef.current = currentSessionId;

    if (prev === null && currentSessionId !== null) {
      fetchSessions();
    }
  }, [currentSessionId, fetchSessions]);

  // Initial fetch on mount / user change
  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSelect = useCallback(
    (sessionId: string) => {
      if (sessionId === currentSessionId) return;
      resetDiscovery();
      resetPanel();
      resetPipeline();
      setIsLoadingSession(true);
      setSessionId(sessionId);
      if (pathname !== "/") router.push("/");
    },
    [currentSessionId, resetDiscovery, resetPanel, resetPipeline, setIsLoadingSession, setSessionId, pathname, router]
  );

  const renameSession = useCallback(
    async (sessionId: string, newTitle: string) => {
      try {
        const res = await fetch(`/api/v1/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle }),
        });
        if (res.ok) {
          const data = await res.json();
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, title: data.title } : s))
          );
          if (sessionId === currentSessionId) {
            useDiscoveryStore.getState().setSessionTitle(data.title);
          }
          return data.title as string;
        }
      } catch (err) {
        console.error("Failed to rename session:", err);
      }
      return null;
    },
    [currentSessionId]
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
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
    },
    [currentSessionId, resetDiscovery, resetPanel, resetPipeline]
  );

  return {
    sessions,
    isLoading,
    currentSessionId,
    user,
    fetchSessions,
    handleSelect,
    renameSession,
    deleteSession,
  };
}
