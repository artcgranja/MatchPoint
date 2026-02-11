import { prisma } from "@/lib/db";
import { BizDevAgent } from "./bizdev";
import { ScoutAgent } from "./scout";
import type { NeedSummary, BizDevPlan, StartupCard } from "./schemas";

export interface PipelineEvent {
  eventType: string;
  stageId: string;
  agentName: string;
  status: string;
  progress: number;
  message: string;
  data?: Record<string, unknown>;
}

async function logStage(
  searchId: string,
  agentName: string,
  status: "idle" | "running" | "complete" | "error",
  progress: number,
  message: string,
  data?: { input?: unknown; output?: unknown; tokensUsed?: number; durationMs?: number }
) {
  await prisma.pipelineStageLog.create({
    data: {
      searchExecutionId: searchId,
      agentName,
      status,
      progress,
      message,
      inputData: data?.input as never,
      outputData: data?.output as never,
      tokensUsed: data?.tokensUsed ?? 0,
      durationMs: data?.durationMs,
    },
  });
}

// ═══════════════════════════════════════════
// Phase 1: BizDev Analysis (streaming with thinking)
// ═══════════════════════════════════════════
export async function* runAnalysis(searchId: string): AsyncGenerator<PipelineEvent> {
  const search = await prisma.searchExecution.findUniqueOrThrow({
    where: { id: searchId },
  });

  await prisma.searchExecution.update({
    where: { id: searchId },
    data: { status: "running" },
  });

  try {
    let needSummary: NeedSummary;
    if (search.bizPlan) {
      needSummary = search.bizPlan as unknown as NeedSummary;
    } else {
      throw new Error("No NeedSummary available for this search");
    }

    yield {
      eventType: "stage_update",
      stageId: "stage-1",
      agentName: "Analysis",
      status: "running",
      progress: 0,
      message: "Preparando plano BizDev...",
    };
    await logStage(searchId, "Analysis", "running", 0, "Starting BizDev analysis...");

    const startAnalysis = Date.now();
    const bizDevAgent = new BizDevAgent();
    let fullPlanText = "";

    // Stream thinking + text chunks
    for await (const chunk of bizDevAgent.streamPlan(needSummary)) {
      if (chunk.type === "thinking") {
        yield {
          eventType: "analysis_thinking",
          stageId: "stage-1",
          agentName: "Analysis",
          status: "running",
          progress: 25,
          message: "",
          data: { text: chunk.text },
        };
      } else {
        fullPlanText += chunk.text;
        yield {
          eventType: "analysis_text",
          stageId: "stage-1",
          agentName: "Analysis",
          status: "running",
          progress: 50,
          message: "",
          data: { text: chunk.text },
        };
      }
    }

    // Extract structured BizDevPlan from the narrative
    const bizDevPlan = await bizDevAgent.extractStructured(fullPlanText, needSummary);

    // Save BizDevPlan to SearchExecution
    await prisma.searchExecution.update({
      where: { id: searchId },
      data: { bizPlan: JSON.parse(JSON.stringify(bizDevPlan)) },
    });

    await logStage(searchId, "Analysis", "complete", 100, "BizDev plan complete", {
      durationMs: Date.now() - startAnalysis,
      output: bizDevPlan,
    });

    yield {
      eventType: "analysis_complete",
      stageId: "stage-1",
      agentName: "Analysis",
      status: "complete",
      progress: 100,
      message: "Plano BizDev concluido",
      data: { plan: bizDevPlan as unknown as Record<string, unknown> },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";

    await prisma.searchExecution.update({
      where: { id: searchId },
      data: { status: "error" },
    });

    yield {
      eventType: "error",
      stageId: "stage-1",
      agentName: "System",
      status: "error",
      progress: 0,
      message,
    };
  }
}

// ═══════════════════════════════════════════
// Phase 2: Scout (runs after user confirmation)
// ═══════════════════════════════════════════
export async function* runScout(searchId: string): AsyncGenerator<PipelineEvent> {
  const search = await prisma.searchExecution.findUniqueOrThrow({
    where: { id: searchId },
    include: { discoverySession: true },
  });

  try {
    // Extract SearchCriteria from saved BizDevPlan
    const bizDevPlan = search.bizPlan as unknown as BizDevPlan;
    if (!bizDevPlan?.searchCriteria) {
      throw new Error("No BizDevPlan with searchCriteria found");
    }
    const searchCriteria = bizDevPlan.searchCriteria;

    // Get original NeedSummary from DiscoverySession
    let needSummary: NeedSummary;
    if (search.discoverySession?.bizPlan) {
      needSummary = search.discoverySession.bizPlan as unknown as NeedSummary;
    } else {
      // Fallback: reconstruct from BizDevPlan fields
      needSummary = {
        companyContext: bizDevPlan.problemAnalysis,
        coreProblem: bizDevPlan.problemAnalysis,
        desiredOutcome: bizDevPlan.proposedSolution,
        constraints: [],
        preferences: [],
      };
    }

    await prisma.searchExecution.update({
      where: { id: searchId },
      data: { status: "running" },
    });

    yield {
      eventType: "stage_update",
      stageId: "stage-2",
      agentName: "Scout",
      status: "running",
      progress: 0,
      message: "Buscando startups...",
    };
    await logStage(searchId, "Scout", "running", 0, "Searching startup databases...");

    const startScout = Date.now();
    const scoutAgent = new ScoutAgent();

    yield {
      eventType: "stage_update",
      stageId: "stage-2",
      agentName: "Scout",
      status: "running",
      progress: 50,
      message: "Avaliando candidatos...",
    };

    const scoutResult = await scoutAgent.search(searchCriteria, needSummary);

    await logStage(searchId, "Scout", "complete", 100, `Found ${scoutResult.cards.length} matches`, {
      durationMs: Date.now() - startScout,
      output: scoutResult,
    });

    yield {
      eventType: "stage_complete",
      stageId: "stage-2",
      agentName: "Scout",
      status: "complete",
      progress: 100,
      message: `${scoutResult.cards.length} startups encontradas`,
    };

    // Save Results to Database
    for (let i = 0; i < scoutResult.cards.length; i++) {
      const card = scoutResult.cards[i];
      await prisma.searchResult.create({
        data: {
          searchExecutionId: searchId,
          startupId: card.id,
          matchScore: 0,
          confidence: 0,
          aiAnalysis: JSON.parse(JSON.stringify({ whyRelevant: card.whyRelevant })),
          rank: i + 1,
        },
      });
    }

    await prisma.searchExecution.update({
      where: { id: searchId },
      data: {
        status: "complete",
        resultCount: scoutResult.cards.length,
      },
    });

    const cards: StartupCard[] = scoutResult.cards;

    yield {
      eventType: "pipeline_complete",
      stageId: "stage-2",
      agentName: "Scout",
      status: "complete",
      progress: 100,
      message: "Pipeline complete",
      data: {
        resultCount: scoutResult.cards.length,
        searchId,
        cards: cards as unknown as Record<string, unknown>[],
        summary: scoutResult.summary,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scout failed";

    await prisma.searchExecution.update({
      where: { id: searchId },
      data: { status: "error" },
    });

    yield {
      eventType: "error",
      stageId: "stage-2",
      agentName: "System",
      status: "error",
      progress: 0,
      message,
    };
  }
}
