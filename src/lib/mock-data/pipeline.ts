import type { PipelineStage } from "@/types";

export const defaultPipelineStages: PipelineStage[] = [
  {
    id: "stage-1",
    name: "Navigator",
    description: "Understanding your business challenge",
    status: "idle",
    progress: 0,
    message: "Waiting to start...",
    icon: "compass",
  },
  {
    id: "stage-2",
    name: "Scout",
    description: "Searching startup databases",
    status: "idle",
    progress: 0,
    message: "Waiting to start...",
    icon: "search",
  },
  {
    id: "stage-3",
    name: "Analyst",
    description: "Deep-diving into financials and metrics",
    status: "idle",
    progress: 0,
    message: "Waiting to start...",
    icon: "bar-chart",
  },
  {
    id: "stage-4",
    name: "Matchmaker",
    description: "Scoring and ranking matches",
    status: "idle",
    progress: 0,
    message: "Waiting to start...",
    icon: "heart",
  },
  {
    id: "stage-5",
    name: "Reporter",
    description: "Generating analysis report",
    status: "idle",
    progress: 0,
    message: "Waiting to start...",
    icon: "file-text",
  },
];
