"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Search, FileText, Check, X, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { slideUp } from "@/lib/motion";
import type { ToolCallEvent } from "@/types";

const TOOL_CONFIG: Record<string, { icon: typeof Search; label: string }> = {
  search_startups: { icon: Search, label: "Pesquisa de Startups" },
  get_startup_details: { icon: FileText, label: "Detalhes da Startup" },
};

interface ToolCallItemProps {
  toolCall: ToolCallEvent;
}

export function ToolCallItem({ toolCall }: ToolCallItemProps) {
  const [expanded, setExpanded] = useState(false);

  const config = TOOL_CONFIG[toolCall.toolName] ?? {
    icon: Search,
    label: toolCall.toolName,
  };
  const Icon = config.icon;

  return (
    <motion.div
      variants={slideUp}
      className="rounded-lg border border-border bg-background-secondary/30"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2.5 px-3 py-2"
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
        <span className="flex-1 text-left text-xs font-medium text-foreground/90">
          {config.label}
        </span>

        {toolCall.status === "running" && (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin text-highlight" />
        )}
        {toolCall.status === "complete" && (
          <Check className="h-3 w-3 shrink-0 text-sage" />
        )}
        {toolCall.status === "error" && (
          <X className="h-3 w-3 shrink-0 text-destructive" />
        )}

        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 text-foreground-muted transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="border-t border-border px-3 py-2 space-y-1.5">
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-foreground-muted/70">
            {JSON.stringify(toolCall.input, null, 2)}
          </pre>
          {toolCall.resultSummary && (
            <p className="text-[10px] font-medium text-sage">
              {toolCall.resultSummary}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
