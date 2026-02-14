import { create } from "zustand";
import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { ConnectionMessage } from "@/types";

type ConnectionStatus = "pending" | "email_sent" | "clicked" | "accepted";

export interface SeekerConnection {
  id: string;
  companyId: number;
  status: ConnectionStatus;
  emailSubject: string;
  emailBody: string;
  createdAt: string;
  company: {
    id: number;
    name: string;
    oneLiner: string;
    smallLogoUrl: string;
  };
}

export interface BuilderConnection {
  id: string;
  companyId: number;
  status: ConnectionStatus;
  emailSubject: string;
  emailBody: string;
  createdAt: string;
  seeker: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ConnectionsStore {
  connectionsByCompany: Map<number, ConnectionStatus>;
  loadingCompanies: Set<number>;
  isLoaded: boolean;
  seekerConnections: SeekerConnection[];
  builderConnections: BuilderConnection[];

  // Chat state
  chatMessages: Map<string, ConnectionMessage[]>;
  chatLoading: Set<string>;
  _pollingTimer: ReturnType<typeof setInterval> | null;

  fetchConnections: () => Promise<void>;
  fetchBuilderConnections: () => Promise<void>;
  createConnection: (companyId: number, searchResultId?: string) => Promise<void>;
  acceptConnection: (id: string) => Promise<void>;
  getStatus: (companyId: number) => ConnectionStatus | null;

  // Chat actions
  fetchMessages: (connectionId: string) => Promise<void>;
  sendMessage: (connectionId: string, content: string, currentUser: { id: string; name: string | null; email: string; avatarUrl: string | null }) => Promise<void>;
  startPolling: (connectionId: string) => void;
  stopPolling: () => void;

  reset: () => void;
}

export const useConnectionsStore = create<ConnectionsStore>()((set, get) => ({
  connectionsByCompany: new Map(),
  loadingCompanies: new Set(),
  isLoaded: false,
  seekerConnections: [],
  builderConnections: [],
  chatMessages: new Map(),
  chatLoading: new Set(),
  _pollingTimer: null,

  fetchConnections: async () => {
    try {
      const connections = await apiGet<SeekerConnection[]>("/connections");
      const map = new Map<number, ConnectionStatus>();
      for (const c of connections) {
        map.set(c.companyId, c.status);
      }
      set({ connectionsByCompany: map, seekerConnections: connections, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  fetchBuilderConnections: async () => {
    try {
      const connections = await apiGet<BuilderConnection[]>("/connections");
      set({ builderConnections: connections, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  createConnection: async (companyId: number, searchResultId?: string) => {
    const loading = new Set(get().loadingCompanies);
    loading.add(companyId);
    set({ loadingCompanies: loading });

    try {
      const result = await apiPost<{ id: string; status: ConnectionStatus }>("/connections", {
        companyId,
        searchResultId,
      });
      const map = new Map(get().connectionsByCompany);
      map.set(companyId, result.status);
      const done = new Set(get().loadingCompanies);
      done.delete(companyId);
      set({ connectionsByCompany: map, loadingCompanies: done });
    } catch {
      const done = new Set(get().loadingCompanies);
      done.delete(companyId);
      set({ loadingCompanies: done });
    }
  },

  acceptConnection: async (id: string) => {
    try {
      await apiPut(`/connections/${id}/accept`);
      set({
        builderConnections: get().builderConnections.map((c) =>
          c.id === id ? { ...c, status: "accepted" as const } : c
        ),
      });
    } catch {
      // noop
    }
  },

  getStatus: (companyId: number) => get().connectionsByCompany.get(companyId) ?? null,

  fetchMessages: async (connectionId: string) => {
    const loading = new Set(get().chatLoading);
    loading.add(connectionId);
    set({ chatLoading: loading });

    try {
      const messages = await apiGet<ConnectionMessage[]>(`/connections/${connectionId}/messages`);
      const map = new Map(get().chatMessages);
      map.set(connectionId, messages);
      const done = new Set(get().chatLoading);
      done.delete(connectionId);
      set({ chatMessages: map, chatLoading: done });
    } catch {
      const done = new Set(get().chatLoading);
      done.delete(connectionId);
      set({ chatLoading: done });
    }
  },

  sendMessage: async (connectionId, content, currentUser) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: ConnectionMessage = {
      id: tempId,
      connectionId,
      senderId: currentUser.id,
      content,
      isSystem: false,
      createdAt: new Date().toISOString(),
      sender: currentUser,
    };

    // Optimistic update
    const map = new Map(get().chatMessages);
    const existing = map.get(connectionId) ?? [];
    map.set(connectionId, [...existing, optimistic]);
    set({ chatMessages: map });

    try {
      const real = await apiPost<ConnectionMessage>(`/connections/${connectionId}/messages`, { content });
      // Replace temp with real
      const updated = new Map(get().chatMessages);
      const msgs = updated.get(connectionId) ?? [];
      updated.set(connectionId, msgs.map((m) => (m.id === tempId ? real : m)));
      set({ chatMessages: updated });
    } catch {
      // Rollback
      const rollback = new Map(get().chatMessages);
      const msgs = rollback.get(connectionId) ?? [];
      rollback.set(connectionId, msgs.filter((m) => m.id !== tempId));
      set({ chatMessages: rollback });
    }
  },

  startPolling: (connectionId: string) => {
    get().stopPolling();

    const timer = setInterval(async () => {
      const messages = get().chatMessages.get(connectionId);
      const lastMessage = messages?.[messages.length - 1];
      const after = lastMessage?.createdAt;

      try {
        const url = after
          ? `/connections/${connectionId}/messages?after=${encodeURIComponent(after)}`
          : `/connections/${connectionId}/messages`;
        const newMessages = await apiGet<ConnectionMessage[]>(url);
        if (newMessages.length > 0) {
          const map = new Map(get().chatMessages);
          const existing = map.get(connectionId) ?? [];
          const existingIds = new Set(existing.map((m) => m.id));
          const unique = newMessages.filter((m) => !existingIds.has(m.id));
          if (unique.length > 0) {
            map.set(connectionId, [...existing, ...unique]);
            set({ chatMessages: map });
          }
        }
      } catch {
        // Silent failure for polling
      }
    }, 5000);

    set({ _pollingTimer: timer });
  },

  stopPolling: () => {
    const timer = get()._pollingTimer;
    if (timer) {
      clearInterval(timer);
      set({ _pollingTimer: null });
    }
  },

  reset: () => {
    get().stopPolling();
    set({
      connectionsByCompany: new Map(),
      loadingCompanies: new Set(),
      isLoaded: false,
      seekerConnections: [],
      builderConnections: [],
      chatMessages: new Map(),
      chatLoading: new Set(),
    });
  },
}));
