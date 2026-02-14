import { create } from "zustand";
import { apiGet, apiPost, apiPut } from "@/lib/api/client";

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
  fetchConnections: () => Promise<void>;
  fetchBuilderConnections: () => Promise<void>;
  createConnection: (companyId: number, searchResultId?: string) => Promise<void>;
  acceptConnection: (id: string) => Promise<void>;
  getStatus: (companyId: number) => ConnectionStatus | null;
  reset: () => void;
}

export const useConnectionsStore = create<ConnectionsStore>()((set, get) => ({
  connectionsByCompany: new Map(),
  loadingCompanies: new Set(),
  isLoaded: false,
  seekerConnections: [],
  builderConnections: [],

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

  reset: () => set({
    connectionsByCompany: new Map(),
    loadingCompanies: new Set(),
    isLoaded: false,
    seekerConnections: [],
    builderConnections: [],
  }),
}));
