"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeader } from "@/components/ui/section-header";
import { PainPointInput } from "@/components/search/pain-point-input";
import { SuggestionChips } from "@/components/search/suggestion-chips";
import { FilterPanel } from "@/components/search/filter-panel";
import { AgentPipelineVisualizer } from "@/components/search/agent-pipeline-visualizer";
import { useSearchStore } from "@/stores/search-store";

export default function SearchPage() {
  const { painPoint, isSearching, startPipeline } = useSearchStore();

  const handleSearch = () => {
    if (!painPoint.trim() || isSearching) return;
    startPipeline();
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Discovery"
        description="Describe your business challenge and let our AI agents find the best startup matches."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <GlassCard>
            <PainPointInput />
            <div className="mt-4">
              <SuggestionChips />
            </div>
            <div className="mt-6">
              <Button
                onClick={handleSearch}
                disabled={!painPoint.trim() || isSearching}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "Searching..." : "Find Matches"}
              </Button>
            </div>
          </GlassCard>

          <AgentPipelineVisualizer />
        </div>

        <div>
          <GlassCard>
            <h3 className="text-sm font-semibold mb-4">Filters</h3>
            <FilterPanel />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
