import { create } from "zustand";
import { apiGet, apiPost } from "@/lib/api/client";

type ConnectionStatus = "pending" | "email_sent" | "clicked" | "accepted";

interface ConnectionsStore {
  connectionsByCompany: Map<number, ConnectionStatus>;
  loadingCompanies: Set<number>;
  isLoaded: boolean;
  fetchConnections: () => Promise<void>;
  createConnection: (companyId: number, searchResultId?: string) => Promise<void>;
  getStatus: (companyId: number) => ConnectionStatus | null;
  reset: () => void;
}

interface ConnectionResponse {
  id: string;
  companyId: number;
  status: ConnectionStatus;
}

export const useConnectionsStore = create<ConnectionsStore>()((set, get) => ({
  connectionsByCompany: new Map(),
  loadingCompanies: new Set(),
  isLoaded: false,

  fetchConnections: async () => {
    try {
      const connections = await apiGet<ConnectionResponse[]>("/connections");
      const map = new Map<number, ConnectionStatus>();
      for (const c of connections) {
        map.set(c.companyId, c.status);
      }
      set({ connectionsByCompany: map, isLoaded: true });
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

  getStatus: (companyId: number) => get().connectionsByCompany.get(companyId) ?? null,

  reset: () => set({ connectionsByCompany: new Map(), loadingCompanies: new Set(), isLoaded: false }),
}));
