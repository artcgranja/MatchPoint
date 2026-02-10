import { create } from "zustand";
import type { Startup } from "@/types";

type SortField = "matchScore" | "name" | "founded" | "employees" | "revenue";
type SortDirection = "asc" | "desc";
type ViewMode = "grid" | "list";

interface ResultsState {
  startups: Startup[];
  sortField: SortField;
  sortDirection: SortDirection;
  viewMode: ViewMode;
  selectedIds: string[];
  currentPage: number;
  itemsPerPage: number;

  setStartups: (startups: Startup[]) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleSort: (field: SortField) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleSelected: (id: string) => void;
  clearSelected: () => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
}

export const useResultsStore = create<ResultsState>()((set) => ({
  startups: [],
  sortField: "matchScore",
  sortDirection: "desc",
  viewMode: "grid",
  selectedIds: [],
  currentPage: 1,
  itemsPerPage: 9,

  setStartups: (startups) => set({ startups, currentPage: 1 }),

  setSortField: (sortField) => set({ sortField }),

  setSortDirection: (sortDirection) => set({ sortDirection }),

  toggleSort: (field) =>
    set((state) => ({
      sortField: field,
      sortDirection:
        state.sortField === field && state.sortDirection === "desc"
          ? "asc"
          : "desc",
    })),

  setViewMode: (viewMode) => set({ viewMode }),

  toggleSelected: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((s) => s !== id)
        : [...state.selectedIds, id],
    })),

  clearSelected: () => set({ selectedIds: [] }),

  setCurrentPage: (currentPage) => set({ currentPage }),

  setItemsPerPage: (itemsPerPage) =>
    set({ itemsPerPage, currentPage: 1 }),
}));
