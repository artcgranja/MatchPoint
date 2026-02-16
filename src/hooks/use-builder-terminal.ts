"use client";

import { useCallback, useRef } from "react";
import { useBuilderStore } from "@/stores/builder-store";

export function useBuilderTerminal() {
  const projectId = useBuilderStore((s) => s.projectId);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(
    (onOutput: (data: string) => void) => {
      if (!projectId) return;

      const es = new EventSource(
        `/api/v1/builder/projects/${projectId}/terminal`
      );

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.output) onOutput(data.output);
        } catch {
          // Ignore
        }
      };

      eventSourceRef.current = es;
    },
    [projectId]
  );

  const sendInput = useCallback(
    async (input: string) => {
      if (!projectId) return;
      await fetch(`/api/v1/builder/projects/${projectId}/terminal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
    },
    [projectId]
  );

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  return { connect, sendInput, disconnect };
}
