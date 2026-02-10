"use client";

import { useEffect, useState, useMemo } from "react";
import { GitCompareArrows } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { StartupSelector } from "@/components/comparison/startup-selector";
import { ComparisonMatrix } from "@/components/comparison/comparison-matrix";
import { ComparisonRadar } from "@/components/comparison/comparison-radar";
import { ComparisonBarChart } from "@/components/comparison/comparison-bar-chart";
import { useComparisonStore } from "@/stores/comparison-store";
import { getStartups } from "@/lib/mock-data";
import type { Startup } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ComparePage() {
  const [allStartups, setAllStartups] = useState<Startup[]>([]);
  const { startupIds } = useComparisonStore();

  useEffect(() => {
    getStartups().then(setAllStartups);
  }, []);

  const selectedStartups = useMemo(
    () => allStartups.filter((s) => startupIds.includes(s.id)),
    [allStartups, startupIds]
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Compare"
        description="Side-by-side comparison of selected startups."
      />

      <GlassCard>
        <StartupSelector
          allStartups={allStartups}
          selectedStartups={selectedStartups}
        />
      </GlassCard>

      {selectedStartups.length === 0 ? (
        <EmptyState
          icon={GitCompareArrows}
          title="No startups selected"
          description="Select startups from the results page or use the selector above to start comparing."
          action={
            <Button asChild variant="outline">
              <Link href="/results">Browse Results</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <ComparisonMatrix startups={selectedStartups} />
          <div className="grid gap-6 lg:grid-cols-2">
            <ComparisonRadar startups={selectedStartups} />
            <ComparisonBarChart startups={selectedStartups} />
          </div>
        </div>
      )}
    </div>
  );
}
