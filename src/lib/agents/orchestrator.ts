import { prisma } from "@/lib/db";
import { AnalysisAgent } from "./analyst";
import { ScoutAgent } from "./scout";
import type { NeedSummary, StartupCard } from "./schemas";

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

export async function* runPipeline(searchId: string): AsyncGenerator<PipelineEvent> {
  const search = await prisma.searchExecution.findUniqueOrThrow({
    where: { id: searchId },
  });

  await prisma.searchExecution.update({
    where: { id: searchId },
    data: { status: "running" },
  });

  try {
    // Get NeedSummary from the linked discovery session or the search's bizPlan field
    let needSummary: NeedSummary;
    if (search.bizPlan) {
      needSummary = search.bizPlan as unknown as NeedSummary;
    } else {
      throw new Error("No NeedSummary available for this search");
    }

    // ═══════════════════════════════════════════
    // Stage 1: Analysis (Opus) — Define search criteria
    // ═══════════════════════════════════════════
    yield {
      eventType: "stage_update",
      stageId: "stage-1",
      agentName: "Analysis",
      status: "running",
      progress: 0,
      message: "Analisando suas necessidades...",
    };
    await logStage(searchId, "Analysis", "running", 0, "Analyzing business needs...");

    const startAnalysis = Date.now();
    const analysisAgent = new AnalysisAgent();

    yield {
      eventType: "stage_update",
      stageId: "stage-1",
      agentName: "Analysis",
      status: "running",
      progress: 50,
      message: "Definindo criterios de busca...",
    };

    const searchCriteria = await analysisAgent.analyze(needSummary);

    await logStage(searchId, "Analysis", "complete", 100, "Search criteria defined", {
      durationMs: Date.now() - startAnalysis,
      output: searchCriteria,
    });

    yield {
      eventType: "stage_complete",
      stageId: "stage-1",
      agentName: "Analysis",
      status: "complete",
      progress: 100,
      message: "Criterios definidos",
    };

    // ═══════════════════════════════════════════
    // Stage 2: Scout (Haiku) — Find matching startups
    // ═══════════════════════════════════════════
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

    // ═══════════════════════════════════════════
    // Save Results to Database
    // ═══════════════════════════════════════════
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

    // Send cards data in pipeline_complete event
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
    const message = error instanceof Error ? error.message : "Pipeline failed";

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
