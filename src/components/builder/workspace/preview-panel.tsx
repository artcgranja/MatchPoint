"use client";

import { useState } from "react";
import { RefreshCw, ExternalLink, Code2 } from "lucide-react";
import { useBuilderStore } from "@/stores/builder-store";

export function PreviewPanel() {
  const previewUrl = useBuilderStore((s) => s.previewUrl);
  const setPreviewUrl = useBuilderStore((s) => s.setPreviewUrl);
  const [key, setKey] = useState(0);

  if (!previewUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-sm text-foreground-muted">
        <Code2 className="mb-2 h-8 w-8 text-foreground-muted/30" />
        <p>No preview available</p>
        <p className="mt-1 text-xs">Start a dev server to see a live preview</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* URL bar */}
      <div className="flex items-center gap-2 border-b border-border bg-background-secondary/30 px-3 py-1">
        <button
          onClick={() => setKey((k) => k + 1)}
          className="rounded-sm p-1 text-foreground-muted transition-colors hover:text-foreground"
          title="Refresh"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
        <div className="flex-1 rounded-sm bg-background/50 px-2 py-0.5 text-xs text-foreground-muted truncate">
          {previewUrl}
        </div>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm p-1 text-foreground-muted transition-colors hover:text-foreground"
          title="Open in new tab"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
        <button
          onClick={() => setPreviewUrl(null)}
          className="rounded-sm p-1 text-foreground-muted transition-colors hover:text-foreground"
          title="Close preview"
        >
          <Code2 className="h-3 w-3" />
        </button>
      </div>

      {/* Iframe */}
      <div className="flex-1">
        <iframe
          key={key}
          src={previewUrl}
          className="h-full w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title="Preview"
        />
      </div>
    </div>
  );
}
