import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing helpers
vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { createConnectionNotification, isBuilderActive } from "../helpers";

describe("createConnectionNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a notification with correct fields", async () => {
    const mockNotification = {
      id: "notif-1",
      userId: "builder-1",
      type: "connection_request",
      title: "Nova solicitação de conexão",
      body: "Alice quer se conectar com Startup Inc",
      actionUrl: "/?conn=conn-1",
      metadata: { connectionId: "conn-1", seekerName: "Alice", companyName: "Startup Inc" },
      read: false,
      readAt: null,
      createdAt: new Date(),
    };

    vi.mocked(prisma.notification.create).mockResolvedValue(mockNotification);

    const result = await createConnectionNotification({
      builderId: "builder-1",
      connectionId: "conn-1",
      seekerName: "Alice",
      companyName: "Startup Inc",
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: "builder-1",
        type: "connection_request",
        title: "Nova solicitação de conexão",
        body: "Alice quer se conectar com Startup Inc",
        actionUrl: "/?conn=conn-1",
        metadata: { connectionId: "conn-1", seekerName: "Alice", companyName: "Startup Inc" },
      },
    });

    expect(result).toEqual(mockNotification);
  });

  it("includes seekerName and companyName in body text", async () => {
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never);

    await createConnectionNotification({
      builderId: "b-1",
      connectionId: "c-1",
      seekerName: "Bob Corp",
      companyName: "TechStartup",
    });

    const createCall = vi.mocked(prisma.notification.create).mock.calls[0][0];
    expect(createCall.data.body).toBe("Bob Corp quer se conectar com TechStartup");
  });

  it("sets actionUrl with correct connection deep link", async () => {
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never);

    await createConnectionNotification({
      builderId: "b-1",
      connectionId: "uuid-123",
      seekerName: "Test",
      companyName: "Test Co",
    });

    const createCall = vi.mocked(prisma.notification.create).mock.calls[0][0];
    expect(createCall.data.actionUrl).toBe("/?conn=uuid-123");
  });
});

describe("isBuilderActive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when user is not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await isBuilderActive("nonexistent");
    expect(result).toBe(false);
  });

  it("returns false when lastSeenAt is null", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      lastSeenAt: null,
    } as never);

    const result = await isBuilderActive("user-1");
    expect(result).toBe(false);
  });

  it("returns true when lastSeenAt is within 7 days", async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      lastSeenAt: twoDaysAgo,
    } as never);

    const result = await isBuilderActive("user-1");
    expect(result).toBe(true);
  });

  it("returns true when lastSeenAt is just now", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      lastSeenAt: new Date(),
    } as never);

    const result = await isBuilderActive("user-1");
    expect(result).toBe(true);
  });

  it("returns false when lastSeenAt is older than 7 days", async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      lastSeenAt: eightDaysAgo,
    } as never);

    const result = await isBuilderActive("user-1");
    expect(result).toBe(false);
  });

  it("returns false when lastSeenAt is exactly 7 days ago", async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      lastSeenAt: sevenDaysAgo,
    } as never);

    const result = await isBuilderActive("user-1");
    expect(result).toBe(false);
  });

  it("queries the correct user ID", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await isBuilderActive("specific-user-id");

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "specific-user-id" },
      select: { lastSeenAt: true },
    });
  });
});
