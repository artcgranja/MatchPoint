import { create } from "zustand";
import type { PipelineStatus } from "@/types";

interface SearchState {
  pipelineStatus: PipelineStatus;
  searchId: string | null;

  setSearchId: (id: string) => void;
  startPipeline: () => void;
  completePipeline: () => void;
  errorPipeline: () => void;
  resetPipeline: () => void;
}

export const useSearchStore = create<SearchState>()((set) => ({
  pipelineStatus: "idle",
  searchId: null,

  setSearchId: (searchId) => set({ searchId }),

  startPipeline: () => set({ pipelineStatus: "running" }),

  completePipeline: () => set({ pipelineStatus: "complete" }),

  errorPipeline: () => set({ pipelineStatus: "error" }),

  resetPipeline: () => set({ pipelineStatus: "idle", searchId: null }),
}));
