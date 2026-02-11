import { create } from "zustand";
import type { BizDevPlanStatus } from "@/types";
import type { BizDevPlan } from "@/lib/agents/schemas";

interface BizDevStore {
  status: BizDevPlanStatus;
  thinkingText: string;
  planText: string;
  plan: BizDevPlan | null;
  sidebarOpen: boolean;

  setStatus: (status: BizDevPlanStatus) => void;
  appendThinking: (chunk: string) => void;
  appendPlanText: (chunk: string) => void;
  setPlan: (plan: BizDevPlan) => void;
  setSidebarOpen: (open: boolean) => void;
  confirm: () => void;
  reset: () => void;
}

export const useBizDevStore = create<BizDevStore>()((set) => ({
  status: "idle",
  thinkingText: "",
  planText: "",
  plan: null,
  sidebarOpen: false,

  setStatus: (status) => set({ status }),
  appendThinking: (chunk) => set((s) => ({ thinkingText: s.thinkingText + chunk })),
  appendPlanText: (chunk) => set((s) => ({ planText: s.planText + chunk })),
  setPlan: (plan) => set({ plan, status: "complete" }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  confirm: () => set({ status: "confirmed" }),
  reset: () => set({ status: "idle", thinkingText: "", planText: "", plan: null, sidebarOpen: false }),
}));
