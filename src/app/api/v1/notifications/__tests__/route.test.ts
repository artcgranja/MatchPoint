import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// Import route handlers
import { GET as getNotifications } from "../route";
import { PUT as markRead } from "../[id]/mark-read/route";
import { PUT as markAllRead } from "../mark-all-read/route";

describe("GET /api/v1/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/v1/notifications");
    const response = await getNotifications(request);

    expect(response.status).toBe(401);
  });

  it("returns notifications and unread count", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      userId: "user-1",
      email: "test@example.com",
      role: "builder",
    });

    const mockNotifications = [
      { id: "n-1", userId: "user-1", type: "connection_request", title: "Test", body: "Body", read: false, createdAt: new Date() },
    ];

    vi.mocked(prisma.notification.findMany).mockResolvedValue(mockNotifications as never);
    vi.mocked(prisma.notification.count).mockResolvedValue(1);

    const request = new Request("http://localhost/api/v1/notifications");
    const response = await getNotifications(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notifications).toHaveLength(1);
    expect(data.unreadCount).toBe(1);
  });

  it("filters unread-only when query param is set", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      userId: "user-1",
      email: "test@example.com",
      role: "builder",
    });

    vi.mocked(prisma.notification.findMany).mockResolvedValue([]);
    vi.mocked(prisma.notification.count).mockResolvedValue(0);

    const request = new Request("http://localhost/api/v1/notifications?unreadOnly=true");
    await getNotifications(request);

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ read: false }),
      })
    );
  });

  it("respects limit parameter with max of 100", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      userId: "user-1",
      email: "test@example.com",
      role: "builder",
    });

    vi.mocked(prisma.notification.findMany).mockResolvedValue([]);
    vi.mocked(prisma.notification.count).mockResolvedValue(0);

    const request = new Request("http://localhost/api/v1/notifications?limit=200");
    await getNotifications(request);

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });
});

describe("PUT /api/v1/notifications/[id]/mark-read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/v1/notifications/n-1/mark-read", {
      method: "PUT",
    });
    const response = await markRead(request, { params: Promise.resolve({ id: "n-1" }) });

    expect(response.status).toBe(401);
  });

  it("returns 404 when notification not found", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      userId: "user-1",
      email: "test@example.com",
      role: "builder",
    });

    vi.mocked(prisma.notification.findFirst).mockResolvedValue(null);

    const request = new Request("http://localhost/api/v1/notifications/nonexistent/mark-read", {
      method: "PUT",
    });
    const response = await markRead(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });

  it("marks notification as read", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      userId: "user-1",
      email: "test@example.com",
      role: "builder",
    });

    vi.mocked(prisma.notification.findFirst).mockResolvedValue({
      id: "n-1",
      userId: "user-1",
      read: false,
    } as never);

    vi.mocked(prisma.notification.update).mockResolvedValue({} as never);

    const request = new Request("http://localhost/api/v1/notifications/n-1/mark-read", {
      method: "PUT",
    });
    const response = await markRead(request, { params: Promise.resolve({ id: "n-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: "n-1" },
      data: { read: true, readAt: expect.any(Date) },
    });
  });

  it("returns success without updating when already read", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      userId: "user-1",
      email: "test@example.com",
      role: "builder",
    });

    vi.mocked(prisma.notification.findFirst).mockResolvedValue({
      id: "n-1",
      userId: "user-1",
      read: true,
    } as never);

    const request = new Request("http://localhost/api/v1/notifications/n-1/mark-read", {
      method: "PUT",
    });
    const response = await markRead(request, { params: Promise.resolve({ id: "n-1" }) });

    expect(response.status).toBe(200);
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it("only finds notifications belonging to the authenticated user", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      userId: "user-1",
      email: "test@example.com",
      role: "builder",
    });

    vi.mocked(prisma.notification.findFirst).mockResolvedValue(null);

    const request = new Request("http://localhost/api/v1/notifications/n-1/mark-read", {
      method: "PUT",
    });
    await markRead(request, { params: Promise.resolve({ id: "n-1" }) });

    expect(prisma.notification.findFirst).toHaveBeenCalledWith({
      where: { id: "n-1", userId: "user-1" },
    });
  });
});

describe("PUT /api/v1/notifications/mark-all-read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);

    const response = await markAllRead();

    expect(response.status).toBe(401);
  });

  it("marks all unread notifications as read", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      userId: "user-1",
      email: "test@example.com",
      role: "builder",
    });

    vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 3 } as never);

    const response = await markAllRead();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", read: false },
      data: { read: true, readAt: expect.any(Date) },
    });
  });
});
