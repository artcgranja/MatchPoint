"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SessionItem } from "@/types";
import { useAuthStore } from "@/stores/auth-store";
import { useDiscoveryStore } from "@/stores/discovery-store";
import { useSessionNavigation } from "@/hooks/use-session-navigation";

export function useSessions() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const currentSessionId = useDiscoveryStore((s) => s.sessionId);
  const { goToSession, goHome } = useSessionNavigation();

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
      goToSession(sessionId);
    },
    [currentSessionId, goToSession]
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
            goHome();
          }
        }
      } catch (err) {
        console.error("Failed to delete session:", err);
      }
    },
    [currentSessionId, goHome]
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
