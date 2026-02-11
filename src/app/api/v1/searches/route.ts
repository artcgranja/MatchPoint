import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const { discoverySessionId } = body;

  if (!discoverySessionId || typeof discoverySessionId !== "string") {
    return NextResponse.json({ error: "discoverySessionId is required" }, { status: 400 });
  }

  let userId: string;
  const user = await getAuthUser();
  if (user) {
    userId = user.userId;
  } else {
    const defaultUser = await prisma.user.upsert({
      where: { email: "default@matchpoint.ai" },
      update: {},
      create: {
        email: "default@matchpoint.ai",
        hashedPassword: "not-a-real-password",
      },
    });
    userId = defaultUser.id;
  }

  // Fetch NeedSummary from discovery session
  const session = await prisma.discoverySession.findUnique({
    where: { id: discoverySessionId },
    select: { bizPlan: true },
  });

  if (!session?.bizPlan) {
    return NextResponse.json({ error: "Discovery session has no NeedSummary" }, { status: 400 });
  }

  const firstUserMsg = await prisma.discoveryMessage.findFirst({
    where: { sessionId: discoverySessionId, role: "user" },
    orderBy: { createdAt: "asc" },
  });

  const search = await prisma.searchExecution.create({
    data: {
      userId,
      painPoint: firstUserMsg?.content ?? "Discovery-based search",
      filters: {},
      status: "idle",
      discoverySessionId,
      bizPlan: session.bizPlan,
    },
  });

  return NextResponse.json({ id: search.id }, { status: 201 });
}
