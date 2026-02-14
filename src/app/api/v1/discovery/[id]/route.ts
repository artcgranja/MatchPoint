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

  // Determine currentStage from session + search state (aligned with getSessionState())
  let currentStage: string;
  let awaitingConfirmation = false;
  let recoveryAction: "retry_analysis" | "retry_scout" | null = null;

  if (!session.isComplete) {
    currentStage = "discovery";
  } else if (!search) {
    currentStage = "discovery"; // Edge case: session complete but no search
  } else if (search.status === "complete") {
    currentStage = "advising";
  } else if (search.status === "error") {
    // Error state — allow retry based on what failed
    if (search.bizPlan) {
      currentStage = "analysis";
      awaitingConfirmation = true; // Let user retry scout via confirm button
    } else {
      currentStage = "analysis";
      recoveryAction = "retry_analysis";
    }
  } else if (!search.bizPlan) {
    // No bizPlan → analysis never completed (interrupted or not yet started)
    currentStage = "analysis";
    recoveryAction = "retry_analysis";
  } else {
    // bizPlan exists, status is "idle" or "running"
    const hasScoutLog = await prisma.pipelineStageLog.findFirst({
      where: { searchExecutionId: search.id, agentName: "Scout" },
    });

    if (hasScoutLog && search.status === "running") {
      // Scout was running but interrupted
      currentStage = "scout";
      recoveryAction = "retry_scout";
    } else {
      // Analysis complete, awaiting scout confirmation
      currentStage = "analysis";
      awaitingConfirmation = true;
    }
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
    recoveryAction,
    isComplete: session.isComplete,
    needSummary: session.bizPlan,
    messages: session.messages.map((m) => {
      const meta = m.metadata as Record<string, unknown> | null;
      return {
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        // Propagate questions metadata for session restore
        ...(meta?.type === "questions" && {
          type: "questions" as const,
          questions: meta.questions,
          questionsContext: meta.context,
          questionsAnswered: !!meta.answered,
          questionsAnswers: meta.answers,
        }),
        // Mark question_answers user messages so frontend can filter them
        ...(meta?.type === "question_answers" && {
          type: "question_answers" as const,
        }),
      };
    }),
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
