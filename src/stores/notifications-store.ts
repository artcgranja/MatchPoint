import { create } from "zustand";
import { apiGet, apiPut } from "@/lib/api/client";

export interface Notification {
  id: string;
  userId: string;
  type: "connection_request" | "connection_accepted" | "connection_message";
  title: string;
  body: string;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

interface NotificationsStore {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  _eventSource: EventSource | null;
  _reconnectAttempts: number;
  _reconnectTimer: ReturnType<typeof setTimeout> | null;

  fetchNotifications: () => Promise<void>;
  connectSSE: () => void;
  disconnectSSE: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  reset: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000; // 1s

export const useNotificationsStore = create<NotificationsStore>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  _eventSource: null,
  _reconnectAttempts: 0,
  _reconnectTimer: null,

  fetchNotifications: async () => {
    try {
      const response = await apiGet<NotificationsResponse>("/notifications?limit=50");
      set({
        notifications: response.notifications,
        unreadCount: response.unreadCount,
      });
    } catch {
      // Silent failure
    }
  },

  connectSSE: () => {
    // Clean up existing connection
    get().disconnectSSE();

    const es = new EventSource("/api/v1/notifications/stream");

    es.addEventListener("notification", (event) => {
      const notification = JSON.parse(event.data) as Notification;
      set((state) => {
        const exists = state.notifications.some((n) => n.id === notification.id);
        if (exists) return state;
        return {
          notifications: [notification, ...state.notifications],
        };
      });
    });

    es.addEventListener("unread_count", (event) => {
      const { unreadCount } = JSON.parse(event.data) as { unreadCount: number };
      set({ unreadCount });
    });

    es.onopen = () => {
      set({ isConnected: true, _reconnectAttempts: 0 });
    };

    es.onerror = () => {
      es.close();
      set({ isConnected: false, _eventSource: null });

      // Reconnect with exponential backoff
      const attempts = get()._reconnectAttempts;
      if (attempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = BASE_RECONNECT_DELAY * Math.pow(2, attempts);
        const timer = setTimeout(() => {
          set({ _reconnectAttempts: attempts + 1 });
          get().connectSSE();
        }, delay);
        set({ _reconnectTimer: timer });
      }
    };

    set({ _eventSource: es });
  },

  disconnectSSE: () => {
    const es = get()._eventSource;
    if (es) {
      es.close();
    }
    const timer = get()._reconnectTimer;
    if (timer) {
      clearTimeout(timer);
    }
    set({
      _eventSource: null,
      _reconnectTimer: null,
      isConnected: false,
      _reconnectAttempts: 0,
    });
  },

  markAsRead: async (id: string) => {
    const notification = get().notifications.find((n) => n.id === id);
    if (!notification || notification.read) return;

    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await apiPut(`/notifications/${id}/mark-read`);
    } catch {
      // Rollback
      get().fetchNotifications();
    }
  },

  markAllAsRead: async () => {
    const prevNotifications = [...get().notifications];
    const prevCount = get().unreadCount;

    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        read: true,
        readAt: n.read ? n.readAt : new Date().toISOString(),
      })),
      unreadCount: 0,
    }));

    try {
      await apiPut("/notifications/mark-all-read");
    } catch {
      // Rollback
      set({ notifications: prevNotifications, unreadCount: prevCount });
    }
  },

  reset: () => {
    get().disconnectSSE();
    set({
      notifications: [],
      unreadCount: 0,
    });
  },
}));
