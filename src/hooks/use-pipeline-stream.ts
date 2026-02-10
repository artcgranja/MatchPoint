"use client";

import { useEffect, useRef } from "react";
import { useSearchStore } from "@/stores/search-store";

export function usePipelineStream(searchId: string | null) {
  const { updateStage, completePipeline } = useSearchStore();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!searchId) return;

    // Close any existing connection
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource(`/api/v1/searches/${searchId}/stream`);
    esRef.current = es;

    es.addEventListener("stage_update", (e) => {
      const data = JSON.parse(e.data);
      updateStage(data.stageId, {
        status: data.status,
        progress: data.progress,
        message: data.message,
      });
    });

    es.addEventListener("stage_complete", (e) => {
      const data = JSON.parse(e.data);
      updateStage(data.stageId, {
        status: "complete",
        progress: 100,
        message: data.message,
      });
    });

    es.addEventListener("pipeline_complete", () => {
      completePipeline();
      es.close();
      esRef.current = null;
    });

    es.addEventListener("error", () => {
      es.close();
      esRef.current = null;
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [searchId, updateStage, completePipeline]);
}
