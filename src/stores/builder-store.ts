import { create } from "zustand";
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
  /** ID of the currently streaming assistant message */
  streamingMessageId: string | null;

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
  setStreamingMessageId: (id: string | null) => void;
  /** Atomically set project and clear all project-specific state */
  hydrateProject: (projectId: string, projectName: string | null) => void;
  reset: () => void;
}

const initialProjectState = {
  activeFile: null,
  openFiles: [] as string[],
  fileTree: [] as FileNode[],
  previewUrl: null,
  chatMessages: [] as BuilderChatMessage[],
  isStreaming: false,
  streamingMessageId: null,
  terminalOpen: true,
  chatOpen: true,
  sandboxId: null,
  sandboxReady: false,
};

export const useBuilderStore = create<BuilderStore>()((set) => ({
  projectId: null,
  projectName: null,
  ...initialProjectState,

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
      const { streamingMessageId } = state;
      const msgs = [...state.chatMessages];

      if (streamingMessageId) {
        const idx = msgs.findIndex((m) => m.id === streamingMessageId);
        if (idx >= 0) {
          msgs[idx] = { ...msgs[idx], content };
          return { chatMessages: msgs };
        }
      }

      // Fallback: update last assistant text message or create new
      const lastIdx = msgs.length - 1;
      if (
        lastIdx >= 0 &&
        msgs[lastIdx].role === "assistant" &&
        (!msgs[lastIdx].type || msgs[lastIdx].type === "text")
      ) {
        msgs[lastIdx] = { ...msgs[lastIdx], content };
      } else {
        const id = crypto.randomUUID();
        msgs.push({ id, role: "assistant", content });
        return { chatMessages: msgs, streamingMessageId: id };
      }
      return { chatMessages: msgs };
    }),

  setChatMessages: (chatMessages) => set({ chatMessages }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setTerminalOpen: (terminalOpen) => set({ terminalOpen }),
  setChatOpen: (chatOpen) => set({ chatOpen }),
  setStreamingMessageId: (streamingMessageId) => set({ streamingMessageId }),

  hydrateProject: (projectId, projectName) =>
    set({
      projectId,
      projectName,
      ...initialProjectState,
    }),

  reset: () =>
    set({
      projectId: null,
      projectName: null,
      ...initialProjectState,
    }),
}));
