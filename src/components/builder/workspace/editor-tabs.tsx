"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/stores/builder-store";

export function EditorTabs() {
  const openFiles = useBuilderStore((s) => s.openFiles);
  const activeFile = useBuilderStore((s) => s.activeFile);
  const setActiveFile = useBuilderStore((s) => s.setActiveFile);
  const closeFile = useBuilderStore((s) => s.closeFile);

  if (openFiles.length === 0) return null;

  return (
    <div
      className="flex items-center overflow-x-auto border-b border-border bg-background-secondary/30"
      role="tablist"
      aria-label="Open files"
    >
      {openFiles.map((path) => {
        const name = path.split("/").pop() ?? path;
        const isActive = path === activeFile;

        return (
          <div
            key={path}
            className={cn(
              "group flex items-center gap-1.5 border-r border-border px-3 py-1.5 text-xs transition-colors",
              isActive
                ? "bg-background text-foreground"
                : "text-foreground-muted hover:bg-background-secondary/50 hover:text-foreground"
            )}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
          >
            <button
              onClick={() => setActiveFile(path)}
              className="truncate max-w-32"
            >
              {name}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(path);
              }}
              className="rounded-sm p-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-background-secondary"
              aria-label={`Close ${name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
