import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserSettings } from "@/types";

interface SettingsState extends UserSettings {
  setTheme: (theme: UserSettings["theme"]) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setCompactView: (compact: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      notificationsEnabled: true,
      compactView: false,

      setTheme: (theme) => set({ theme }),

      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),

      setCompactView: (compactView) => set({ compactView }),
    }),
    {
      name: "matchpoint-settings",
    }
  )
);
