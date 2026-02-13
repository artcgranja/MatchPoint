import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.discoverySession.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        where: { role: "user" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { content: true },
      },
      searches: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, resultCount: true },
      },
    },
  });

  const result = sessions.map((s) => {
    const firstMessage = s.messages[0]?.content ?? null;
    const search = s.searches[0] ?? null;
    const hasResults = search?.status === "complete";

    // Compute granular pipeline stage
    let pipelineStage: "discovery" | "analysis" | "results";
    if (!s.isComplete) {
      pipelineStage = "discovery";
    } else if (hasResults) {
      pipelineStage = "results";
    } else {
      pipelineStage = "analysis";
    }

    return {
      id: s.id,
      title: s.title ?? (firstMessage ? firstMessage.slice(0, 60) : "New Chat"),
      pipelineStage,
      isComplete: s.isComplete,
      hasResults,
      resultCount: search?.resultCount ?? 0,
      preview: firstMessage ? firstMessage.slice(0, 120) : null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  });

  return NextResponse.json(result);
}
