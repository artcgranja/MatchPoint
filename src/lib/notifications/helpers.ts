import { prisma } from "@/lib/db";

export async function createConnectionNotification({
  builderId,
  connectionId,
  seekerName,
  companyName,
}: {
  builderId: string;
  connectionId: string;
  seekerName: string;
  companyName: string;
}) {
  return prisma.notification.create({
    data: {
      userId: builderId,
      type: "connection_request",
      title: "Nova solicitação de conexão",
      body: `${seekerName} quer se conectar com ${companyName}`,
      actionUrl: `/?conn=${connectionId}`,
      metadata: JSON.parse(JSON.stringify({ connectionId, seekerName, companyName })),
    },
  });
}

const ACTIVE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function isBuilderActive(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastSeenAt: true },
  });

  if (!user?.lastSeenAt) return false;

  return Date.now() - user.lastSeenAt.getTime() < ACTIVE_THRESHOLD_MS;
}
