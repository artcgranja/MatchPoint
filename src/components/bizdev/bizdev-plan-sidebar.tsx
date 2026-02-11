"use client";

import { useRef, useEffect } from "react";
import { Brain, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useBizDevStore } from "@/stores/bizdev-store";
import { BizDevThinkingBlock } from "./bizdev-thinking-block";
import { BizDevPlanContent } from "./bizdev-plan-content";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface BizDevPlanSidebarProps {
  onConfirm: () => void;
  onClose: () => void;
}

export function BizDevPlanSidebar({ onConfirm, onClose }: BizDevPlanSidebarProps) {
  const { status, thinkingText, planText } = useBizDevStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as content streams
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [thinkingText, planText]);

  const statusLabel = {
    idle: "",
    thinking: "Analisando...",
    writing: "Definindo solucao...",
    complete: "Analise pronta",
    confirmed: "Confirmado",
  }[status];

  return (
    <div className="flex h-full flex-col overflow-hidden border-l border-border bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-highlight/10">
            <Brain className="h-4 w-4 text-highlight" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Analise de Produto</h3>
            {statusLabel && (
              <p className="text-[10px] text-foreground-muted">{statusLabel}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4"
      >
        {thinkingText && (
          <BizDevThinkingBlock
            text={thinkingText}
            isActive={status === "thinking"}
          />
        )}

        {planText && (
          <BizDevPlanContent
            text={planText}
            isStreaming={status === "writing"}
          />
        )}

        {!planText && status === "thinking" && (
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

      {/* Footer */}
      <AnimatePresence>
        {status === "complete" && (
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
