"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionStage } from "@/types";

const STAGE_PLACEHOLDERS: Record<SessionStage, string> = {
  discovery: "Conte sobre sua empresa e o desafio que enfrenta...",
  analysis: "Analisando suas necessidades...",
  scout: "Buscando startups...",
  complete: "Pergunte sobre as startups encontradas...",
};

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  currentStage: SessionStage;
}

export function ChatInput({ onSend, disabled, currentStage }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isProcessing = currentStage === "analysis" || currentStage === "scout";
  const isDisabled = disabled || isProcessing;

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
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
    <div className="relative rounded-2xl border border-border bg-background-secondary/40 shadow-sm transition-colors focus-within:border-highlight/30 focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.1)]">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={STAGE_PLACEHOLDERS[currentStage]}
        disabled={isDisabled}
        rows={1}
        className="w-full resize-none bg-transparent px-4 pt-3 pb-12 text-sm placeholder:text-foreground-muted/50 focus:outline-none disabled:opacity-50"
      />
      <div className="absolute right-2 bottom-2">
        <Button
          onClick={handleSend}
          disabled={!value.trim() || isDisabled}
          size="icon"
          className="h-8 w-8 rounded-lg"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
