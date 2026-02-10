"use client";

import { Textarea } from "@/components/ui/textarea";
import { useSearchStore } from "@/stores/search-store";

export function PainPointInput() {
  const { painPoint, setPainPoint } = useSearchStore();

  return (
    <div className="space-y-2">
      <label htmlFor="pain-point" className="text-sm font-medium">
        Describe your business challenge
      </label>
      <div className="relative">
        <Textarea
          id="pain-point"
          placeholder="e.g., We need an AI solution to automate our customer support workflow and reduce response times by 50%..."
          value={painPoint}
          onChange={(e) => setPainPoint(e.target.value)}
          className="min-h-[120px] resize-none bg-background-secondary/50 text-base"
          maxLength={1000}
        />
        <span className="absolute bottom-3 right-3 text-xs text-foreground-muted font-code">
          {painPoint.length}/1000
        </span>
      </div>
    </div>
  );
}
