"use client";

import { useSearchStore } from "@/stores/search-store";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const suggestions = [
  "Automate customer support with AI to reduce response times",
  "Find blockchain solutions for supply chain transparency",
  "Implement real-time cybersecurity threat detection",
  "Build predictive analytics for patient health outcomes",
  "Optimize energy consumption with smart grid technology",
  "Deploy AI-powered employee training and upskilling",
];

interface SuggestionChipsProps {
  onSelect?: (suggestion: string) => void;
}

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  const { setPainPoint } = useSearchStore();

  const handleClick = (suggestion: string) => {
    if (onSelect) {
      onSelect(suggestion);
    } else {
      setPainPoint(suggestion);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-foreground-muted">Try a suggestion:</p>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleClick(suggestion)}
              className="inline-flex shrink-0 items-center rounded-full border border-border bg-background-secondary/50 px-3 py-1.5 text-xs text-foreground-muted hover:bg-highlight/10 hover:text-highlight hover:border-highlight/20 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
