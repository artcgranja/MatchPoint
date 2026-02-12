"use client";

import { useRef, useEffect } from "react";
import { Loader2, Rocket } from "lucide-react";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { ScoutProgressBar } from "./scout-progress-bar";
import { ToolCallLog } from "./tool-call-log";
import { ScoutCardGrid } from "./scout-card-grid";

export function ScoutTab() {
  const { scoutStatus, cards } = useAgentPanelStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [scoutStatus, cards.length]);

  if (scoutStatus === "idle") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background-secondary/50">
          <Rocket className="h-5 w-5 text-foreground-muted/40" />
        </div>
        <p className="text-xs text-foreground-muted/60">
          A busca de startups iniciará após confirmar a análise.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
      >
        <ScoutProgressBar />
        <ToolCallLog />
        <ScoutCardGrid />

        {scoutStatus === "searching" && cards.length === 0 && (
          <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-foreground-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-highlight" />
            <span>Buscando startups...</span>
          </div>
        )}
      </div>
    </div>
  );
}
