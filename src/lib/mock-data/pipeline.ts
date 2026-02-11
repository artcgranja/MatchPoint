import type { PipelineStage } from "@/types";

export const defaultPipelineStages: PipelineStage[] = [
  {
    id: "stage-1",
    name: "Analysis",
    description: "Analyzing business needs and defining search criteria",
    status: "idle",
    progress: 0,
    message: "Waiting to start...",
  },
  {
    id: "stage-2",
    name: "Scout",
    description: "Searching startup databases for matches",
    status: "idle",
    progress: 0,
    message: "Waiting to start...",
  },
];
