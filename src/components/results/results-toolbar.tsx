"use client";

import Link from "next/link";
import { LayoutGrid, List, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResultsStore } from "@/stores/results-store";
import { useComparisonStore } from "@/stores/comparison-store";

export function ResultsToolbar() {
  const { startups, viewMode, setViewMode, sortField, toggleSort } =
    useResultsStore();
  const { startupIds } = useComparisonStore();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground-muted">
          {startups.length} results
        </span>

        <Select
          value={sortField}
          onValueChange={(v) => toggleSort(v as typeof sortField)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="matchScore">Match Score</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="founded">Founded</SelectItem>
            <SelectItem value="employees">Employees</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        {startupIds.length > 0 && (
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/compare">
              <GitCompareArrows className="h-4 w-4" />
              Compare ({startupIds.length})
            </Link>
          </Button>
        )}

        <div className="flex rounded-md border border-border">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-r-none"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-l-none"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
