import { create } from "zustand";

interface ComparisonState {
  startupIds: string[];

  addStartup: (id: string) => void;
  removeStartup: (id: string) => void;
  clearAll: () => void;
  isSelected: (id: string) => boolean;
}

export const useComparisonStore = create<ComparisonState>()((set, get) => ({
  startupIds: [],

  addStartup: (id) =>
    set((state) => {
      if (state.startupIds.length >= 4 || state.startupIds.includes(id))
        return state;
      return { startupIds: [...state.startupIds, id] };
    }),

  removeStartup: (id) =>
    set((state) => ({
      startupIds: state.startupIds.filter((s) => s !== id),
    })),

  clearAll: () => set({ startupIds: [] }),

  isSelected: (id) => get().startupIds.includes(id),
}));
