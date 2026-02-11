import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      pipelineStatus: "idle",
      searchId: null,

      setSearchId: (searchId) => set({ searchId }),

      startPipeline: () => set({ pipelineStatus: "running" }),

      completePipeline: () => set({ pipelineStatus: "complete" }),

      errorPipeline: () => set({ pipelineStatus: "error" }),

      resetPipeline: () => set({ pipelineStatus: "idle", searchId: null }),
    }),
    {
      name: "matchpoint-search",
      partialize: (state) => ({
        searchId: state.searchId,
      }),
    }
  )
);
