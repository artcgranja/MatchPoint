"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SendHorizontal } from "lucide-react";
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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
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
    <div className="flex items-end gap-2 border-t border-border pt-4">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={STAGE_PLACEHOLDERS[currentStage]}
        disabled={isDisabled}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-border bg-background-secondary/50 px-4 py-3 text-sm placeholder:text-foreground-muted/50 focus:border-highlight/30 focus:outline-none focus:ring-1 focus:ring-highlight/20 disabled:opacity-50"
      />
      <Button
        onClick={handleSend}
        disabled={!value.trim() || isDisabled}
        size="icon"
        className="h-10 w-10 shrink-0 rounded-xl"
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
