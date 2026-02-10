import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await prisma.discoverySession.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: session.id,
    currentPhase: session.currentPhase,
    isComplete: session.isComplete,
    bizPlan: session.bizPlan,
    messages: session.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      phase: m.phase,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
