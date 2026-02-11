import { mockStartups } from "./startups";
import { defaultPipelineStages } from "./pipeline";
import type { Startup, PipelineStage } from "@/types";

function delay(ms: number = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getStartups(): Promise<Startup[]> {
  await delay();
  return [...mockStartups];
}

export async function getStartupById(
  id: string
): Promise<Startup | undefined> {
  await delay(500);
  return mockStartups.find((s) => s.id === id);
}

export function getPipelineStages(): PipelineStage[] {
  return defaultPipelineStages.map((stage) => ({ ...stage }));
}
