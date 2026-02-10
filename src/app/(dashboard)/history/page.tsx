"use client";

import { useEffect, useState, useMemo } from "react";
import { History } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchHistoryList } from "@/components/history/search-history-list";
import { HistoryFilters } from "@/components/history/history-filters";
import { getSearches } from "@/lib/mock-data";
import type { SearchQuery } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HistoryPage() {
  const [searches, setSearches] = useState<SearchQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    getSearches().then((data) => {
      setSearches(data);
      setLoading(false);
    });
  }, []);

  const sorted = useMemo(() => {
    const copy = [...searches];
    if (sortBy === "results") {
      copy.sort((a, b) => b.resultCount - a.resultCount);
    }
    return copy;
  }, [searches, sortBy]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="History" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-background-secondary"
            />
          ))}
        </div>
      </div>
    );
  }

  if (searches.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeader title="History" />
        <EmptyState
          icon={History}
          title="No search history"
          description="Your past searches will appear here."
          action={
            <Button asChild>
              <Link href="/search">Start Searching</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="History"
        description="Review and re-run your past searches."
        action={<HistoryFilters sortBy={sortBy} onSortChange={setSortBy} />}
      />
      <SearchHistoryList searches={sorted} />
    </div>
  );
}
