"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Check, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { ToolCallItem } from "./tool-call-item";

export function ToolCallLog() {
  const { toolCalls } = useAgentPanelStore();
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const completedCount = toolCalls.filter(
    (tc) => tc.status === "complete"
  ).length;
  const runningCount = toolCalls.filter(
    (tc) => tc.status === "running"
  ).length;

  // Auto-scroll to bottom when new tool calls arrive while expanded
  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [expanded, toolCalls.length]);

  if (toolCalls.length === 0) return null;

  return (
    <div className="px-4 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background-secondary/30 px-3 py-2 transition-colors hover:bg-background-secondary/50"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
        <span className="flex-1 text-left text-xs font-medium text-foreground/90">
          {toolCalls.length} {toolCalls.length === 1 ? "ação" : "ações"}
        </span>

        <span className="flex items-center gap-1 text-[10px] text-sage">
          <Check className="h-3 w-3" />
          {completedCount}
        </span>

        {runningCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-highlight">
            <Loader2 className="h-3 w-3 animate-spin" />
            {runningCount}
          </span>
        )}

        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 text-foreground-muted transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div
          ref={scrollRef}
          className="mt-2 max-h-60 space-y-2 overflow-y-auto pr-1"
        >
          {toolCalls.map((tc) => (
            <ToolCallItem key={tc.id} toolCall={tc} />
          ))}
        </div>
      )}
    </div>
  );
}
