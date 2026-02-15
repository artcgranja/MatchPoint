import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock API client
vi.mock("@/lib/api/client", () => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
}));

import { apiGet, apiPut } from "@/lib/api/client";
import { useNotificationsStore, type Notification } from "../notifications-store";

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "notif-1",
    userId: "user-1",
    type: "connection_request",
    title: "Test notification",
    body: "Test body",
    actionUrl: "/?conn=conn-1",
    metadata: { connectionId: "conn-1" },
    read: false,
    readAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("notifications-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotificationsStore.getState().reset();
  });

  afterEach(() => {
    useNotificationsStore.getState().reset();
  });

  describe("initial state", () => {
    it("has empty notifications and zero unread count", () => {
      const state = useNotificationsStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.isConnected).toBe(false);
    });
  });

  describe("fetchNotifications", () => {
    it("populates notifications and unread count from API", async () => {
      const notifications = [makeNotification(), makeNotification({ id: "notif-2" })];
      vi.mocked(apiGet).mockResolvedValue({ notifications, unreadCount: 2 });

      await useNotificationsStore.getState().fetchNotifications();

      const state = useNotificationsStore.getState();
      expect(state.notifications).toEqual(notifications);
      expect(state.unreadCount).toBe(2);
      expect(apiGet).toHaveBeenCalledWith("/notifications?limit=50");
    });

    it("handles API errors silently", async () => {
      vi.mocked(apiGet).mockRejectedValue(new Error("Network error"));

      await useNotificationsStore.getState().fetchNotifications();

      const state = useNotificationsStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe("markAsRead", () => {
    it("optimistically marks notification as read", async () => {
      const notif = makeNotification({ id: "n-1", read: false });
      vi.mocked(apiGet).mockResolvedValue({ notifications: [notif], unreadCount: 1 });
      await useNotificationsStore.getState().fetchNotifications();

      vi.mocked(apiPut).mockResolvedValue({ success: true });
      await useNotificationsStore.getState().markAsRead("n-1");

      const state = useNotificationsStore.getState();
      expect(state.notifications[0].read).toBe(true);
      expect(state.notifications[0].readAt).not.toBeNull();
      expect(state.unreadCount).toBe(0);
      expect(apiPut).toHaveBeenCalledWith("/notifications/n-1/mark-read");
    });

    it("skips already-read notifications", async () => {
      const notif = makeNotification({ id: "n-1", read: true });
      vi.mocked(apiGet).mockResolvedValue({ notifications: [notif], unreadCount: 0 });
      await useNotificationsStore.getState().fetchNotifications();

      await useNotificationsStore.getState().markAsRead("n-1");

      expect(apiPut).not.toHaveBeenCalled();
    });

    it("skips non-existent notification IDs", async () => {
      await useNotificationsStore.getState().markAsRead("nonexistent");
      expect(apiPut).not.toHaveBeenCalled();
    });

    it("does not go below 0 unread count", async () => {
      // Set up with 0 unread, 1 unread notification (edge case)
      const notif = makeNotification({ id: "n-1", read: false });
      vi.mocked(apiGet).mockResolvedValue({ notifications: [notif], unreadCount: 0 });
      await useNotificationsStore.getState().fetchNotifications();

      vi.mocked(apiPut).mockResolvedValue({ success: true });
      await useNotificationsStore.getState().markAsRead("n-1");

      expect(useNotificationsStore.getState().unreadCount).toBe(0);
    });
  });

  describe("markAllAsRead", () => {
    it("marks all notifications as read optimistically", async () => {
      const notifications = [
        makeNotification({ id: "n-1", read: false }),
        makeNotification({ id: "n-2", read: false }),
        makeNotification({ id: "n-3", read: true, readAt: "2024-01-01T00:00:00Z" }),
      ];
      vi.mocked(apiGet).mockResolvedValue({ notifications, unreadCount: 2 });
      await useNotificationsStore.getState().fetchNotifications();

      vi.mocked(apiPut).mockResolvedValue({ success: true });
      await useNotificationsStore.getState().markAllAsRead();

      const state = useNotificationsStore.getState();
      expect(state.notifications.every((n) => n.read)).toBe(true);
      expect(state.unreadCount).toBe(0);
      // Already-read notification should keep original readAt
      expect(state.notifications[2].readAt).toBe("2024-01-01T00:00:00Z");
      expect(apiPut).toHaveBeenCalledWith("/notifications/mark-all-read");
    });

    it("rolls back on API error", async () => {
      const notif = makeNotification({ id: "n-1", read: false });
      vi.mocked(apiGet).mockResolvedValue({ notifications: [notif], unreadCount: 1 });
      await useNotificationsStore.getState().fetchNotifications();

      vi.mocked(apiPut).mockRejectedValue(new Error("API error"));
      await useNotificationsStore.getState().markAllAsRead();

      const state = useNotificationsStore.getState();
      expect(state.notifications[0].read).toBe(false);
      expect(state.unreadCount).toBe(1);
    });
  });

  describe("reset", () => {
    it("clears all state", async () => {
      const notif = makeNotification();
      vi.mocked(apiGet).mockResolvedValue({ notifications: [notif], unreadCount: 1 });
      await useNotificationsStore.getState().fetchNotifications();

      useNotificationsStore.getState().reset();

      const state = useNotificationsStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.isConnected).toBe(false);
    });
  });
});
