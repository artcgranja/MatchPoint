import { mockStartups } from "./startups";
import { mockSearches } from "./searches";
import { defaultPipelineStages } from "./pipeline";
import type {
  Startup,
  SearchQuery,
  PipelineStage,
  SearchFilters,
} from "@/types";

function delay(ms: number = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getStartups(
  filters?: Partial<SearchFilters>
): Promise<Startup[]> {
  await delay();
  let results = [...mockStartups];

  if (filters?.industries?.length) {
    results = results.filter((s) =>
      s.industries.some((i) => filters.industries!.includes(i))
    );
  }
  if (filters?.fundingStages?.length) {
    results = results.filter((s) =>
      filters.fundingStages!.includes(s.fundingStage)
    );
  }
  if (filters?.minMatchScore) {
    results = results.filter(
      (s) => s.aiAnalysis.matchScore >= filters.minMatchScore!
    );
  }
  if (filters?.maxEmployeeCount) {
    results = results.filter(
      (s) => s.employees <= filters.maxEmployeeCount!
    );
  }
  if (filters?.technologies?.length) {
    results = results.filter((s) =>
      s.technologies.some((t) => filters.technologies!.includes(t))
    );
  }

  return results.sort(
    (a, b) => b.aiAnalysis.matchScore - a.aiAnalysis.matchScore
  );
}

export async function getStartupById(
  id: string
): Promise<Startup | undefined> {
  await delay(500);
  return mockStartups.find((s) => s.id === id);
}

export async function getSearches(): Promise<SearchQuery[]> {
  await delay(600);
  return [...mockSearches].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function getSearchById(
  id: string
): Promise<SearchQuery | undefined> {
  await delay(400);
  return mockSearches.find((s) => s.id === id);
}

export function getPipelineStages(): PipelineStage[] {
  return defaultPipelineStages.map((stage) => ({ ...stage }));
}
