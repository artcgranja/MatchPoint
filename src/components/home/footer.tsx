"use client";

import { Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border-base py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2 text-foreground-muted">
          <Compass className="h-4 w-4 text-highlight" />
          <span className="text-sm font-heading font-medium">MatchPoint</span>
        </div>
        <p className="text-xs text-foreground-muted/50">
          &copy; {new Date().getFullYear()} Astro Intelligence. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
