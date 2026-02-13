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
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { content: true, role: true },
      },
      searches: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          status: true,
          resultCount: true,
          scoutSummary: true,
          bizPlan: true,
          results: {
            orderBy: { rank: "asc" },
            take: 3,
            select: {
              company: {
                select: { name: true, oneLiner: true },
              },
            },
          },
        },
      },
    },
  });

  const result = sessions.map((s) => {
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

    // First user message for title fallback
    const firstUserMsg = [...s.messages]
      .reverse()
      .find((m) => m.role === "user");

    // Stage-specific preview
    let preview: string | null = null;
    let topStartups: string[] | null = null;
    let analysisPreview: string | null = null;

    if (pipelineStage === "results" && search) {
      // Show top startup names from results
      topStartups =
        search.results?.map((r) => r.company.name) ?? [];
      // Scout summary as preview text
      preview = search.scoutSummary?.slice(0, 150) ?? null;
    } else if (pipelineStage === "analysis" && search?.bizPlan) {
      // Extract a snippet from the product document
      const plan = search.bizPlan as Record<string, unknown>;
      const planText =
        typeof plan === "string" ? plan : (plan.summary as string) ?? (plan.overview as string) ?? null;
      analysisPreview = typeof planText === "string" ? planText.slice(0, 150) : null;
      if (!analysisPreview) {
        // Fallback: stringify first 150 chars
        const raw = JSON.stringify(plan);
        analysisPreview = raw.length > 10 ? raw.slice(0, 150) : null;
      }
    } else {
      // Discovery: last assistant message
      const lastAssistant = s.messages.find((m) => m.role === "assistant");
      preview = lastAssistant?.content.slice(0, 150) ?? firstUserMsg?.content.slice(0, 150) ?? null;
    }

    return {
      id: s.id,
      title: s.title ?? (firstUserMsg ? firstUserMsg.content.slice(0, 60) : "New Chat"),
      pipelineStage,
      isComplete: s.isComplete,
      hasResults,
      resultCount: search?.resultCount ?? 0,
      preview,
      topStartups,
      analysisPreview,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  });

  return NextResponse.json(result);
}
