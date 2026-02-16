import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BuilderChatMessage, FileNode } from "@/types/builder";

interface BuilderStore {
  projectId: string | null;
  projectName: string | null;
  sandboxId: string | null;
  sandboxReady: boolean;
  activeFile: string | null;
  openFiles: string[];
  fileTree: FileNode[];
  previewUrl: string | null;
  chatMessages: BuilderChatMessage[];
  isStreaming: boolean;
  terminalOpen: boolean;
  chatOpen: boolean;

  setProjectId: (id: string | null) => void;
  setProjectName: (name: string | null) => void;
  setSandboxId: (id: string | null) => void;
  setSandboxReady: (ready: boolean) => void;
  setActiveFile: (path: string | null) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setFileTree: (tree: FileNode[]) => void;
  setPreviewUrl: (url: string | null) => void;
  addChatMessage: (message: BuilderChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setChatMessages: (messages: BuilderChatMessage[]) => void;
  setIsStreaming: (streaming: boolean) => void;
  setTerminalOpen: (open: boolean) => void;
  setChatOpen: (open: boolean) => void;
  reset: () => void;
}

export const useBuilderStore = create<BuilderStore>()(
  persist(
    (set) => ({
      projectId: null,
      projectName: null,
      sandboxId: null,
      sandboxReady: false,
      activeFile: null,
      openFiles: [],
      fileTree: [],
      previewUrl: null,
      chatMessages: [],
      isStreaming: false,
      terminalOpen: true,
      chatOpen: true,

      setProjectId: (projectId) => set({ projectId }),
      setProjectName: (projectName) => set({ projectName }),
      setSandboxId: (sandboxId) => set({ sandboxId }),
      setSandboxReady: (sandboxReady) => set({ sandboxReady }),

      setActiveFile: (activeFile) => set({ activeFile }),

      openFile: (path) =>
        set((state) => ({
          openFiles: state.openFiles.includes(path)
            ? state.openFiles
            : [...state.openFiles, path],
          activeFile: path,
        })),

      closeFile: (path) =>
        set((state) => {
          const remaining = state.openFiles.filter((f) => f !== path);
          return {
            openFiles: remaining,
            activeFile:
              state.activeFile === path
                ? remaining[remaining.length - 1] ?? null
                : state.activeFile,
          };
        }),

      setFileTree: (fileTree) => set({ fileTree }),
      setPreviewUrl: (previewUrl) => set({ previewUrl }),

      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, message],
        })),

      updateLastAssistantMessage: (content) =>
        set((state) => {
          const msgs = [...state.chatMessages];
          const lastIdx = msgs.length - 1;
          if (
            lastIdx >= 0 &&
            msgs[lastIdx].role === "assistant" &&
            (!msgs[lastIdx].type || msgs[lastIdx].type === "text")
          ) {
            msgs[lastIdx] = { ...msgs[lastIdx], content };
          } else {
            msgs.push({ role: "assistant", content });
          }
          return { chatMessages: msgs };
        }),

      setChatMessages: (chatMessages) => set({ chatMessages }),
      setIsStreaming: (isStreaming) => set({ isStreaming }),
      setTerminalOpen: (terminalOpen) => set({ terminalOpen }),
      setChatOpen: (chatOpen) => set({ chatOpen }),

      reset: () =>
        set({
          projectId: null,
          projectName: null,
          sandboxId: null,
          sandboxReady: false,
          activeFile: null,
          openFiles: [],
          fileTree: [],
          previewUrl: null,
          chatMessages: [],
          isStreaming: false,
          terminalOpen: true,
          chatOpen: true,
        }),
    }),
    {
      name: "matchpoint-builder",
      partialize: (state) => ({
        projectId: state.projectId,
      }),
    }
  )
);
