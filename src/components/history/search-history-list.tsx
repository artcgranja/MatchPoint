"use client";

import Link from "next/link";
import { RotateCcw, Eye, Calendar, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SearchQuery } from "@/types";

interface SearchHistoryListProps {
  searches: SearchQuery[];
}

export function SearchHistoryList({ searches }: SearchHistoryListProps) {
  return (
    <div className="space-y-3">
      {searches.map((search) => (
        <GlassCard key={search.id} className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium line-clamp-2">
                {search.painPoint}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(search.timestamp).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {search.resultCount} results
                </span>
                <StatusBadge status={search.status} />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/search">
                <RotateCcw className="h-3.5 w-3.5" />
                Re-run
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/results">
                <Eye className="h-3.5 w-3.5" />
                View Results
              </Link>
            </Button>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
