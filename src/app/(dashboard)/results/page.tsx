"use client";

import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ResultsToolbar } from "@/components/results/results-toolbar";
import { ResultsGrid } from "@/components/results/results-grid";
import { Pagination } from "@/components/results/pagination";
import { useResultsStore } from "@/stores/results-store";
import { getStartups } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const {
    startups,
    setStartups,
    sortField,
    sortDirection,
    currentPage,
    itemsPerPage,
  } = useResultsStore();

  useEffect(() => {
    getStartups().then((data) => {
      setStartups(data);
      setLoading(false);
    });
  }, [setStartups]);

  const sorted = useMemo(() => {
    const copy = [...startups];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "matchScore":
          cmp = a.aiAnalysis.matchScore - b.aiAnalysis.matchScore;
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "founded":
          cmp = a.founded - b.founded;
          break;
        case "employees":
          cmp = a.employees - b.employees;
          break;
        case "revenue":
          cmp = a.metrics.revenue - b.metrics.revenue;
          break;
      }
      return sortDirection === "desc" ? -cmp : cmp;
    });
    return copy;
  }, [startups, sortField, sortDirection]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, currentPage, itemsPerPage]);

  if (!loading && startups.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader title="Results" />
        <EmptyState
          icon={Search}
          title="No results yet"
          description="Run a search to find matching startups for your business challenge."
          action={
            <Button asChild>
              <Link href="/search">Go to Search</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Results"
        description="Ranked startup matches based on your business challenge."
      />
      <ResultsToolbar />
      <ResultsGrid startups={paginated} loading={loading} />
      <Pagination totalItems={sorted.length} />
    </div>
  );
}
