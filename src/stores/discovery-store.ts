import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionStage, DiscoveryMessage } from "@/types";

export type DiscoveryState =
  | "idle"
  | "chatting"
  | "processing"
  | "complete"
  | "advising";

interface DiscoveryStore {
  sessionId: string | null;
  sessionTitle: string | null;
  discoveryState: DiscoveryState;
  currentStage: SessionStage;
  messages: DiscoveryMessage[];
  isStreaming: boolean;
  isLoadingSession: boolean;

  setSessionId: (id: string | null) => void;
  setSessionTitle: (title: string | null) => void;
  setDiscoveryState: (state: DiscoveryState) => void;
  setCurrentStage: (stage: SessionStage) => void;
  addMessage: (message: DiscoveryMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setIsLoadingSession: (loading: boolean) => void;
  setMessages: (messages: DiscoveryMessage[]) => void;
  reset: () => void;
}

export const useDiscoveryStore = create<DiscoveryStore>()(
  persist(
    (set) => ({
      sessionId: null,
      sessionTitle: null,
      discoveryState: "idle",
      currentStage: "discovery",
      messages: [],
      isStreaming: false,
      isLoadingSession: false,

      setSessionId: (sessionId) => set({ sessionId }),

      setSessionTitle: (sessionTitle) => set({ sessionTitle }),

      setDiscoveryState: (discoveryState) => set({ discoveryState }),

      setCurrentStage: (currentStage) => set({ currentStage }),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      updateLastAssistantMessage: (content) =>
        set((state) => {
          const msgs = [...state.messages];
          const lastIdx = msgs.length - 1;
          if (
            lastIdx >= 0 &&
            msgs[lastIdx].role === "assistant" &&
            !msgs[lastIdx].type // Don't overwrite special message types (questions, cards, stage-update)
          ) {
            msgs[lastIdx] = { ...msgs[lastIdx], content };
          } else {
            msgs.push({ role: "assistant", content });
          }
          return { messages: msgs };
        }),

      setIsStreaming: (isStreaming) => set({ isStreaming }),

      setIsLoadingSession: (isLoadingSession) => set({ isLoadingSession }),

      setMessages: (messages) => set({ messages }),

      reset: () =>
        set({
          sessionId: null,
          sessionTitle: null,
          discoveryState: "idle",
          currentStage: "discovery",
          messages: [],
          isStreaming: false,
          isLoadingSession: false,
        }),
    }),
    {
      name: "matchpoint-discovery",
      partialize: (state) => ({
        sessionId: state.sessionId,
      }),
    }
  )
);
