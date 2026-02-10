"use client";

import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSearchStore } from "@/stores/search-store";
import type { FundingStage } from "@/types";

const industries = [
  "AI/ML",
  "FinTech",
  "HealthTech",
  "CleanTech",
  "Cybersecurity",
  "EdTech",
  "Data Analytics",
  "Logistics",
  "Biotech",
  "Cloud Infrastructure",
  "RetailTech",
  "AgriTech",
];

const fundingStages: FundingStage[] = [
  "Pre-Seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D+",
];

function FilterContent() {
  const { filters, setFilters, resetFilters } = useSearchStore();

  const toggleIndustry = (industry: string) => {
    const current = filters.industries;
    setFilters({
      industries: current.includes(industry)
        ? current.filter((i) => i !== industry)
        : [...current, industry],
    });
  };

  const toggleFundingStage = (stage: FundingStage) => {
    const current = filters.fundingStages;
    setFilters({
      fundingStages: current.includes(stage)
        ? current.filter((s) => s !== stage)
        : [...current, stage],
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Industries</Label>
        <div className="flex flex-wrap gap-2">
          {industries.map((industry) => (
            <Badge
              key={industry}
              variant={
                filters.industries.includes(industry) ? "default" : "outline"
              }
              className="cursor-pointer"
              onClick={() => toggleIndustry(industry)}
            >
              {industry}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Funding Stage</Label>
        <div className="flex flex-wrap gap-2">
          {fundingStages.map((stage) => (
            <Badge
              key={stage}
              variant={
                filters.fundingStages.includes(stage) ? "default" : "outline"
              }
              className="cursor-pointer"
              onClick={() => toggleFundingStage(stage)}
            >
              {stage}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Min Match Score</Label>
          <span className="font-code text-sm">{filters.minMatchScore}%</span>
        </div>
        <Slider
          value={[filters.minMatchScore]}
          onValueChange={([v]) => setFilters({ minMatchScore: v })}
          max={100}
          step={5}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Max Employees</Label>
          <span className="font-code text-sm">
            {filters.maxEmployeeCount.toLocaleString()}
          </span>
        </div>
        <Slider
          value={[filters.maxEmployeeCount]}
          onValueChange={([v]) => setFilters({ maxEmployeeCount: v })}
          max={10000}
          step={50}
        />
      </div>

      <Button variant="outline" size="sm" onClick={resetFilters}>
        Reset Filters
      </Button>
    </div>
  );
}

export function FilterPanel() {
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <FilterContent />
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Search Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
