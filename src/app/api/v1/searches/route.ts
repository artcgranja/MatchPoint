import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { stripMarkdown } from "@/lib/utils";
import type { SessionPipelineStage } from "@/types";

function computeStage(isComplete: boolean | undefined, status: string): SessionPipelineStage {
  if (!isComplete) return "discovery";
  if (status === "complete") return "results";
  return "analysis";
}

function getPreview(stage: SessionPipelineStage, search: any): string | null {
  if (stage === "results") return search.scoutSummary?.slice(0, 150) ?? null;

  if (stage === "analysis" && search.bizPlan) {
    const plan = search.bizPlan;
    const rawText = typeof plan === "string" ? plan : plan?.productDocument;
    return rawText ? stripMarkdown(rawText).slice(0, 200) : null;
  }

  return search.painPoint?.slice(0, 150) ?? null;
}

export async function GET(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const stageFilter = searchParams.get("stage") as SessionPipelineStage | null;
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);

  // Fetch all searches for the user
  const searches = await prisma.searchExecution.findMany({
    where: { userId: auth.userId },
    include: {
      discoverySession: {
        select: {
          title: true,
          isComplete: true,
          messages: {
            where: { role: "user" },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      },
      results: {
        orderBy: { rank: "asc" },
        take: 3,
        select: { company: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter and map in memory (simpler and more flexible)
  const filtered = searches
    .map((search) => {
      const session = search.discoverySession;
      const stage = computeStage(session?.isComplete, search.status);

      // Apply stage filter
      if (stageFilter && stage !== stageFilter) return null;

      const firstUserMsg = session?.messages?.[0];
      const sessionTitle = session?.title ?? firstUserMsg?.content.slice(0, 60) ?? "New Chat";

      return {
        id: search.id,
        discoverySessionId: search.discoverySessionId,
        sessionTitle,
        status: search.status,
        stage,
        resultCount: search.resultCount,
        scoutSummary: search.scoutSummary,
        preview: getPreview(stage, search),
        topStartups: stage === "results" ? search.results.map((r) => r.company.name) : null,
        createdAt: search.createdAt.toISOString(),
        updatedAt: search.updatedAt.toISOString(),
      };
    })
    .filter(Boolean);

  // Apply pagination
  const total = filtered.length;
  const data = filtered.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ data, total, page, limit });
}
