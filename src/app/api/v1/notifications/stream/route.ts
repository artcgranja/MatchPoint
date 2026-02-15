import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

const HEARTBEAT_INTERVAL = 20_000; // 20s (under Vercel 25s timeout)
const POLL_INTERVAL = 3_000; // 3s DB poll
const ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  // Track activity on initial SSE connection
  prisma.user.update({
    where: { id: auth.userId },
    data: { lastSeenAt: new Date() },
  }).catch(() => { /* non-critical */ });

  const stream = new ReadableStream({
    start(controller) {
      let lastChecked = new Date();
      let lastActivityUpdate = Date.now();

      const send = (event: string, data: object) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          cleanup();
        }
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (pollTimer) clearInterval(pollTimer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      // Heartbeat to keep connection alive
      heartbeatTimer = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`:heartbeat\n\n`));
        } catch {
          cleanup();
        }
      }, HEARTBEAT_INTERVAL);

      // Poll DB for new notifications
      pollTimer = setInterval(async () => {
        if (closed) return;
        try {
          const [newNotifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
              where: {
                userId: auth.userId,
                createdAt: { gt: lastChecked },
              },
              orderBy: { createdAt: "asc" },
            }),
            prisma.notification.count({
              where: { userId: auth.userId, read: false },
            }),
          ]);

          lastChecked = new Date();

          if (newNotifications.length > 0) {
            for (const notification of newNotifications) {
              send("notification", notification);
            }
          }

          // Always send unread count so badge stays in sync
          send("unread_count", { unreadCount });

          // Periodically update lastSeenAt (debounced to 5min)
          if (Date.now() - lastActivityUpdate > ACTIVITY_UPDATE_INTERVAL) {
            lastActivityUpdate = Date.now();
            prisma.user.update({
              where: { id: auth.userId },
              data: { lastSeenAt: new Date() },
            }).catch(() => { /* non-critical */ });
          }
        } catch {
          // Silent failure — poll will retry
        }
      }, POLL_INTERVAL);
    },
    cancel() {
      closed = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (pollTimer) clearInterval(pollTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
