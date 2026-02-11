import { create } from "zustand";
import type { BizDevPlanStatus } from "@/types";

interface BizDevStore {
  status: BizDevPlanStatus;
  thinkingText: string;
  planText: string;
  sidebarOpen: boolean;

  setStatus: (status: BizDevPlanStatus) => void;
  appendThinking: (chunk: string) => void;
  appendPlanText: (chunk: string) => void;
  setSidebarOpen: (open: boolean) => void;
  confirm: () => void;
  reset: () => void;
}

export const useBizDevStore = create<BizDevStore>()((set) => ({
  status: "idle",
  thinkingText: "",
  planText: "",
  sidebarOpen: false,

  setStatus: (status) => set({ status }),
  appendThinking: (chunk) => set((s) => ({ thinkingText: s.thinkingText + chunk })),
  appendPlanText: (chunk) => set((s) => ({ planText: s.planText + chunk })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  confirm: () => set({ status: "confirmed" }),
  reset: () => set({ status: "idle", thinkingText: "", planText: "", sidebarOpen: false }),
}));
