import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionStage, DiscoveryMessage } from "@/types";

export type DiscoveryState =
  | "idle"
  | "chatting"
  | "processing"
  | "complete";

interface DiscoveryStore {
  sessionId: string | null;
  discoveryState: DiscoveryState;
  currentStage: SessionStage;
  messages: DiscoveryMessage[];
  isStreaming: boolean;

  setSessionId: (id: string | null) => void;
  setDiscoveryState: (state: DiscoveryState) => void;
  setCurrentStage: (stage: SessionStage) => void;
  addMessage: (message: DiscoveryMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setMessages: (messages: DiscoveryMessage[]) => void;
  reset: () => void;
}

export const useDiscoveryStore = create<DiscoveryStore>()(
  persist(
    (set) => ({
      sessionId: null,
      discoveryState: "idle",
      currentStage: "discovery",
      messages: [],
      isStreaming: false,

      setSessionId: (sessionId) => set({ sessionId }),

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
          if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
            msgs[lastIdx] = { ...msgs[lastIdx], content };
          } else {
            msgs.push({ role: "assistant", content });
          }
          return { messages: msgs };
        }),

      setIsStreaming: (isStreaming) => set({ isStreaming }),

      setMessages: (messages) => set({ messages }),

      reset: () =>
        set({
          sessionId: null,
          discoveryState: "idle",
          currentStage: "discovery",
          messages: [],
          isStreaming: false,
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
