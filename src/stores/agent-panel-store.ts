import { create } from "zustand";
import type {
  AgentPanelTab,
  BizDevPlanStatus,
  ScoutStatus,
  StartupCard,
  ToolCallEvent,
} from "@/types";

interface AgentPanelStore {
  // Panel
  panelOpen: boolean;
  activeTab: AgentPanelTab;

  // Analysis (migrated from bizdev-store)
  analysisStatus: BizDevPlanStatus;
  thinkingText: string;
  planText: string;

  // Scout
  scoutStatus: ScoutStatus;
  scoutProgress: number;
  scoutMessage: string;
  toolCalls: ToolCallEvent[];
  cards: StartupCard[];
  scoutSummary: string;

  // Panel actions
  setPanelOpen: (open: boolean) => void;
  setActiveTab: (tab: AgentPanelTab) => void;

  // Analysis actions
  setAnalysisStatus: (status: BizDevPlanStatus) => void;
  appendThinking: (chunk: string) => void;
  appendPlanText: (chunk: string) => void;
  confirmPlan: () => void;

  // Scout actions
  setScoutStatus: (status: ScoutStatus) => void;
  setScoutProgress: (progress: number, message: string) => void;
  addToolCall: (toolCall: ToolCallEvent) => void;
  updateToolCall: (id: string, update: Partial<ToolCallEvent>) => void;
  setCards: (cards: StartupCard[], summary: string) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  panelOpen: false,
  activeTab: "analysis" as AgentPanelTab,
  analysisStatus: "idle" as BizDevPlanStatus,
  thinkingText: "",
  planText: "",
  scoutStatus: "idle" as ScoutStatus,
  scoutProgress: 0,
  scoutMessage: "",
  toolCalls: [] as ToolCallEvent[],
  cards: [] as StartupCard[],
  scoutSummary: "",
};

export const useAgentPanelStore = create<AgentPanelStore>()((set) => ({
  ...initialState,

  // Panel
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),

  // Analysis
  setAnalysisStatus: (analysisStatus) => set({ analysisStatus }),
  appendThinking: (chunk) =>
    set((s) => ({ thinkingText: s.thinkingText + chunk })),
  appendPlanText: (chunk) =>
    set((s) => ({ planText: s.planText + chunk })),
  confirmPlan: () => set({ analysisStatus: "confirmed" }),

  // Scout
  setScoutStatus: (scoutStatus) => set({ scoutStatus }),
  setScoutProgress: (scoutProgress, scoutMessage) =>
    set({ scoutProgress, scoutMessage }),
  addToolCall: (toolCall) =>
    set((s) => ({ toolCalls: [...s.toolCalls, toolCall] })),
  updateToolCall: (id, update) =>
    set((s) => ({
      toolCalls: s.toolCalls.map((tc) =>
        tc.id === id ? { ...tc, ...update } : tc
      ),
    })),
  setCards: (cards, scoutSummary) =>
    set({ cards, scoutSummary }),

  // Reset
  reset: () => set(initialState),
}));
