import { create } from "zustand";
import { apiGet, apiPost, apiDelete } from "@/lib/api/client";

interface SavedStartupsStore {
  savedIds: Set<number>;
  isLoaded: boolean;
  fetchSavedIds: () => Promise<void>;
  saveStartup: (companyId: number) => Promise<void>;
  unsaveStartup: (companyId: number) => Promise<void>;
  isSaved: (companyId: number) => boolean;
  reset: () => void;
}

export const useSavedStartupsStore = create<SavedStartupsStore>()((set, get) => ({
  savedIds: new Set<number>(),
  isLoaded: false,

  fetchSavedIds: async () => {
    try {
      const { ids } = await apiGet<{ ids: number[] }>("/saved-startups/ids");
      set({ savedIds: new Set(ids), isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  saveStartup: async (companyId: number) => {
    const prev = new Set(get().savedIds);
    set({ savedIds: new Set([...prev, companyId]) });
    try {
      await apiPost("/saved-startups", { companyId });
    } catch {
      set({ savedIds: prev });
    }
  },

  unsaveStartup: async (companyId: number) => {
    const prev = new Set(get().savedIds);
    const next = new Set(prev);
    next.delete(companyId);
    set({ savedIds: next });
    try {
      await apiDelete(`/saved-startups/${companyId}`);
    } catch {
      set({ savedIds: prev });
    }
  },

  isSaved: (companyId: number) => get().savedIds.has(companyId),

  reset: () => set({ savedIds: new Set(), isLoaded: false }),
}));
