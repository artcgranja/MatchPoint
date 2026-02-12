import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarStore {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      collapsed: false,

      setCollapsed: (collapsed) => set({ collapsed }),

      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
    }),
    {
      name: "matchpoint-sidebar",
      partialize: (state) => ({
        collapsed: state.collapsed,
      }),
    }
  )
);
