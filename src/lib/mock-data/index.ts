import { defaultPipelineStages } from "./pipeline";
import type { PipelineStage } from "@/types";

export function getPipelineStages(): PipelineStage[] {
  return defaultPipelineStages.map((stage) => ({ ...stage }));
}
