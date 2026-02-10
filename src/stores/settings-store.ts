import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserSettings, SearchFilters } from "@/types";

interface SettingsState extends UserSettings {
  setTheme: (theme: UserSettings["theme"]) => void;
  setDefaultFilters: (filters: Partial<SearchFilters>) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setCompactView: (compact: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      defaultFilters: {},
      notificationsEnabled: true,
      compactView: false,

      setTheme: (theme) => set({ theme }),

      setDefaultFilters: (defaultFilters) => set({ defaultFilters }),

      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),

      setCompactView: (compactView) => set({ compactView }),
    }),
    {
      name: "matchpoint-settings",
    }
  )
);
