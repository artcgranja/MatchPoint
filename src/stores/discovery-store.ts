import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScopePhase, DiscoveryMessage } from "@/types";

export type DiscoveryState =
  | "idle"
  | "chatting"
  | "completing"
  | "transitioning";

interface DiscoveryStore {
  sessionId: string | null;
  discoveryState: DiscoveryState;
  currentPhase: ScopePhase;
  messages: DiscoveryMessage[];
  isComplete: boolean;
  isStreaming: boolean;

  setSessionId: (id: string | null) => void;
  setDiscoveryState: (state: DiscoveryState) => void;
  setCurrentPhase: (phase: ScopePhase) => void;
  addMessage: (message: DiscoveryMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setComplete: (complete: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setMessages: (messages: DiscoveryMessage[]) => void;
  reset: () => void;
}

export const useDiscoveryStore = create<DiscoveryStore>()(
  persist(
    (set) => ({
      sessionId: null,
      discoveryState: "idle",
      currentPhase: "situation",
      messages: [],
      isComplete: false,
      isStreaming: false,

      setSessionId: (sessionId) => set({ sessionId }),

      setDiscoveryState: (discoveryState) => set({ discoveryState }),

      setCurrentPhase: (currentPhase) => set({ currentPhase }),

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

      setComplete: (isComplete) => set({ isComplete }),

      setIsStreaming: (isStreaming) => set({ isStreaming }),

      setMessages: (messages) => set({ messages }),

      reset: () =>
        set({
          sessionId: null,
          discoveryState: "idle",
          currentPhase: "situation",
          messages: [],
          isComplete: false,
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
