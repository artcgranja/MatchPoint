"use client";

import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";

interface BizDevPlanContentProps {
  text: string;
  isStreaming: boolean;
}

export function BizDevPlanContent({ text, isStreaming }: BizDevPlanContentProps) {
  return (
    <div className="prose prose-sm prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2 prose-p:text-foreground/90 prose-p:leading-relaxed prose-li:text-foreground/90 prose-strong:text-foreground prose-ul:my-2 prose-ol:my-2">
      <Streamdown
        plugins={{ code }}
        isAnimating={isStreaming}
        caret={isStreaming ? "block" : undefined}
      >
        {text}
      </Streamdown>
    </div>
  );
}
