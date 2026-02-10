import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SearchFilters, PipelineStage, PipelineStatus } from "@/types";
import { getPipelineStages } from "@/lib/mock-data";

interface SearchState {
  painPoint: string;
  filters: SearchFilters;
  pipelineStages: PipelineStage[];
  pipelineStatus: PipelineStatus;
  isSearching: boolean;

  setPainPoint: (painPoint: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  startPipeline: () => void;
  updateStage: (stageId: string, updates: Partial<PipelineStage>) => void;
  completePipeline: () => void;
  resetPipeline: () => void;
}

const defaultFilters: SearchFilters = {
  industries: [],
  fundingStages: [],
  locations: [],
  minMatchScore: 0,
  maxEmployeeCount: 10000,
  technologies: [],
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      painPoint: "",
      filters: { ...defaultFilters },
      pipelineStages: getPipelineStages(),
      pipelineStatus: "idle",
      isSearching: false,

      setPainPoint: (painPoint) => set({ painPoint }),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      resetFilters: () => set({ filters: { ...defaultFilters } }),

      startPipeline: () =>
        set({
          pipelineStages: getPipelineStages(),
          pipelineStatus: "running",
          isSearching: true,
        }),

      updateStage: (stageId, updates) =>
        set((state) => ({
          pipelineStages: state.pipelineStages.map((stage) =>
            stage.id === stageId ? { ...stage, ...updates } : stage
          ),
        })),

      completePipeline: () =>
        set({ pipelineStatus: "complete", isSearching: false }),

      resetPipeline: () =>
        set({
          pipelineStages: getPipelineStages(),
          pipelineStatus: "idle",
          isSearching: false,
        }),
    }),
    {
      name: "matchpoint-search",
      partialize: (state) => ({
        painPoint: state.painPoint,
        filters: state.filters,
      }),
    }
  )
);
