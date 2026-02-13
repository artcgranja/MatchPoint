import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const session = await prisma.discoverySession.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      searches: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          results: {
            orderBy: { rank: "asc" },
            include: { company: true },
          },
          orchestratorMessages: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.userId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const search = session.searches[0] ?? null;

  // Determine currentStage from session + search state
  let currentStage: string;
  let awaitingConfirmation = false;
  if (!session.isComplete) {
    currentStage = "discovery";
  } else if (!search) {
    currentStage = "complete";
  } else if (search.status === "complete") {
    currentStage = "advising";
  } else if (search.bizPlan && search.status === "idle") {
    // BizPlan exists but scout hasn't started — user needs to approve
    currentStage = "analysis";
    awaitingConfirmation = true;
  } else {
    currentStage = "analysis";
  }

  // Build cards from search results
  const cards = search?.results.map((r) => ({
    id: r.company.id,
    name: r.company.name,
    oneLiner: r.company.oneLiner,
    whyRelevant: (r.aiAnalysis as Record<string, unknown>)?.whyRelevant ?? "",
    industries: r.company.industries,
    tags: r.company.tags,
    batch: r.company.batch,
    location: r.company.allLocations,
    website: r.company.website,
    ycUrl: r.company.ycUrl,
  })) ?? [];

  const bizPlan = search?.bizPlan as Record<string, unknown> | null;

  return NextResponse.json({
    id: session.id,
    title: session.title,
    currentStage,
    awaitingConfirmation,
    isComplete: session.isComplete,
    needSummary: session.bizPlan,
    messages: session.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
    searchExecution: search
      ? {
          id: search.id,
          status: search.status,
          resultCount: search.resultCount,
          scoutSummary: search.scoutSummary,
          productDocument: bizPlan?.productDocument ?? null,
          cards,
          orchestratorMessages: search.orchestratorMessages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
          })),
        }
      : null,
  });
}
