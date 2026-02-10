"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScopePhase } from "@/types";

const PHASE_PLACEHOLDERS: Record<ScopePhase, string> = {
  situation: "Conte sobre sua empresa e seu contexto de negocio...",
  challenge: "Quais desafios voce enfrenta hoje?",
  objectives: "O que seria o cenario ideal para voce?",
  parameters: "Que tipo de solucao voce busca?",
  evaluation: "O que e mais importante na hora de escolher um parceiro?",
  complete: "Discovery concluida.",
};

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  currentPhase: ScopePhase;
}

export function ChatInput({ onSend, disabled, currentPhase }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-border pt-4">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={PHASE_PLACEHOLDERS[currentPhase]}
        disabled={disabled || currentPhase === "complete"}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-border bg-background-secondary/50 px-4 py-3 text-sm placeholder:text-foreground-muted/50 focus:border-highlight/30 focus:outline-none focus:ring-1 focus:ring-highlight/20 disabled:opacity-50"
      />
      <Button
        onClick={handleSend}
        disabled={!value.trim() || disabled || currentPhase === "complete"}
        size="icon"
        className="h-10 w-10 shrink-0 rounded-xl"
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
