"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BizDevThinkingBlockProps {
  text: string;
  isActive: boolean;
}

export function BizDevThinkingBlock({ text, isActive }: BizDevThinkingBlockProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-4 rounded-lg border border-border bg-background-secondary/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground-muted"
      >
        <Sparkles className={cn("h-3 w-3", isActive && "animate-pulse text-highlight")} />
        <span className="font-medium">Pensamento</span>
        <ChevronDown
          className={cn(
            "ml-auto h-3 w-3 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="max-h-40 overflow-y-auto px-3 pb-3">
              <p className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-foreground-muted/70">
                {text}
                {isActive && (
                  <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-highlight" />
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
