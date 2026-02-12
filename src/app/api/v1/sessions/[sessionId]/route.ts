import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const session = await prisma.discoverySession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.userId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete associated search executions first (cascade handles their children)
  await prisma.searchExecution.deleteMany({
    where: { discoverySessionId: sessionId },
  });

  // Delete the session (cascade handles discovery messages)
  await prisma.discoverySession.delete({
    where: { id: sessionId },
  });

  return new Response(null, { status: 204 });
}
