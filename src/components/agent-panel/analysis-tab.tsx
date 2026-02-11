"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentPanelStore } from "@/stores/agent-panel-store";
import { BizDevThinkingBlock } from "@/components/bizdev/bizdev-thinking-block";
import { BizDevPlanContent } from "@/components/bizdev/bizdev-plan-content";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface AnalysisTabProps {
  onConfirm: () => void;
}

export function AnalysisTab({ onConfirm }: AnalysisTabProps) {
  const { analysisStatus, thinkingText, planText } = useAgentPanelStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [thinkingText, planText]);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4"
      >
        {thinkingText && (
          <BizDevThinkingBlock
            text={thinkingText}
            isActive={analysisStatus === "thinking"}
          />
        )}

        {planText && (
          <BizDevPlanContent
            text={planText}
            isStreaming={analysisStatus === "writing"}
          />
        )}

        {!planText && analysisStatus === "thinking" && (
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-highlight [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-highlight [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-highlight [animation-delay:300ms]" />
            </div>
            <span>Pensando profundamente...</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {analysisStatus === "complete" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            className="shrink-0 border-t border-border p-4"
          >
            <Button
              onClick={onConfirm}
              className="w-full gap-2 bg-highlight text-white hover:bg-highlight/90"
            >
              <Check className="h-4 w-4" />
              Confirmar e Buscar Startups
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
