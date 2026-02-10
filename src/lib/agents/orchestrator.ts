import { prisma } from "@/lib/db";
import { NavigatorAgent } from "./navigator";
import { ScoutAgent } from "./scout";
import { AnalystAgent } from "./analyst";
import { MatchmakerAgent } from "./matchmaker";
import { ReporterAgent } from "./reporter";
import type { BizPlan, AIAnalysisOutput } from "./schemas";

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
    // ═══════════════════════════════════════════
    // Stage 1: Navigator — Generate BizPlan
    // ═══════════════════════════════════════════
    yield {
      eventType: "stage_update",
      stageId: "stage-1",
      agentName: "Navigator",
      status: "running",
      progress: 0,
      message: "Parsing business challenge...",
    };
    await logStage(searchId, "Navigator", "running", 0, "Parsing business challenge...");

    const startNav = Date.now();
    const navigator = new NavigatorAgent();

    yield {
      eventType: "stage_update",
      stageId: "stage-1",
      agentName: "Navigator",
      status: "running",
      progress: 33,
      message: "Identifying key requirements...",
    };

    let bizPlan: BizPlan;

    if (search.bizPlan) {
      // BizPlan already exists from discovery session
      bizPlan = search.bizPlan as unknown as BizPlan;
    } else {
      bizPlan = await navigator.generateBizPlan(search.painPoint);
    }

    yield {
      eventType: "stage_update",
      stageId: "stage-1",
      agentName: "Navigator",
      status: "running",
      progress: 80,
      message: "Defining search parameters...",
    };

    // Save BizPlan to search
    await prisma.searchExecution.update({
      where: { id: searchId },
      data: { bizPlan: JSON.parse(JSON.stringify(bizPlan)) },
    });

    await logStage(searchId, "Navigator", "complete", 100, "Search parameters defined", {
      durationMs: Date.now() - startNav,
    });

    yield {
      eventType: "stage_complete",
      stageId: "stage-1",
      agentName: "Navigator",
      status: "complete",
      progress: 100,
      message: "Search parameters defined",
    };

    // ═══════════════════════════════════════════
    // Stage 2: Scout — Find Candidates
    // ═══════════════════════════════════════════
    yield {
      eventType: "stage_update",
      stageId: "stage-2",
      agentName: "Scout",
      status: "running",
      progress: 0,
      message: "Scanning startup databases...",
    };
    await logStage(searchId, "Scout", "running", 0, "Scanning startup databases...");

    const startScout = Date.now();
    const scout = new ScoutAgent();
    const candidateIds = await scout.search(bizPlan);

    yield {
      eventType: "stage_update",
      stageId: "stage-2",
      agentName: "Scout",
      status: "running",
      progress: 70,
      message: `Found ${candidateIds.length} candidates...`,
    };

    // Fetch full startup data for candidates
    const candidates = await prisma.startup.findMany({
      where: { id: { in: candidateIds } },
      include: { teamMembers: true, metrics: true },
    });

    await logStage(searchId, "Scout", "complete", 100, `Found ${candidates.length} candidates`, {
      durationMs: Date.now() - startScout,
    });

    yield {
      eventType: "stage_complete",
      stageId: "stage-2",
      agentName: "Scout",
      status: "complete",
      progress: 100,
      message: `Found ${candidates.length} candidates`,
    };

    // ═══════════════════════════════════════════
    // Stage 3: Analyst — Deep Analysis
    // ═══════════════════════════════════════════
    yield {
      eventType: "stage_update",
      stageId: "stage-3",
      agentName: "Analyst",
      status: "running",
      progress: 0,
      message: "Analyzing top candidates...",
    };
    await logStage(searchId, "Analyst", "running", 0, "Analyzing top candidates...");

    const startAnalyst = Date.now();
    const analyst = new AnalystAgent();
    const analyzed: Array<{
      startupId: string;
      startupName: string;
      aiAnalysis: AIAnalysisOutput;
    }> = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const analysis = await analyst.analyze(candidate, bizPlan);
      analyzed.push({
        startupId: candidate.id,
        startupName: candidate.name,
        aiAnalysis: analysis,
      });

      const progress = Math.round(((i + 1) / candidates.length) * 100);
      yield {
        eventType: "stage_update",
        stageId: "stage-3",
        agentName: "Analyst",
        status: "running",
        progress,
        message: `Analyzed ${i + 1}/${candidates.length} startups`,
      };
    }

    await logStage(searchId, "Analyst", "complete", 100, "Deep analysis complete", {
      durationMs: Date.now() - startAnalyst,
    });

    yield {
      eventType: "stage_complete",
      stageId: "stage-3",
      agentName: "Analyst",
      status: "complete",
      progress: 100,
      message: "Deep analysis complete",
    };

    // ═══════════════════════════════════════════
    // Stage 4: Matchmaker — Final Ranking
    // ═══════════════════════════════════════════
    yield {
      eventType: "stage_update",
      stageId: "stage-4",
      agentName: "Matchmaker",
      status: "running",
      progress: 0,
      message: "Computing match scores...",
    };
    await logStage(searchId, "Matchmaker", "running", 0, "Computing match scores...");

    const startMatchmaker = Date.now();
    const matchmaker = new MatchmakerAgent();
    const ranked = await matchmaker.rank(analyzed, bizPlan);

    yield {
      eventType: "stage_update",
      stageId: "stage-4",
      agentName: "Matchmaker",
      status: "running",
      progress: 80,
      message: "Finalizing top matches...",
    };

    await logStage(searchId, "Matchmaker", "complete", 100, "Ranking complete", {
      durationMs: Date.now() - startMatchmaker,
    });

    yield {
      eventType: "stage_complete",
      stageId: "stage-4",
      agentName: "Matchmaker",
      status: "complete",
      progress: 100,
      message: "Ranking complete",
    };

    // ═══════════════════════════════════════════
    // Stage 5: Reporter — Generate Report
    // ═══════════════════════════════════════════
    yield {
      eventType: "stage_update",
      stageId: "stage-5",
      agentName: "Reporter",
      status: "running",
      progress: 0,
      message: "Generating analysis report...",
    };
    await logStage(searchId, "Reporter", "running", 0, "Generating analysis report...");

    const startReporter = Date.now();
    const reporter = new ReporterAgent();

    // Build ranked data for reporter
    const rankedForReport = ranked.rankings.map((r, idx) => {
      const candidate = candidates.find((c) => c.id === r.startupId);
      const analysis = analyzed.find((a) => a.startupId === r.startupId);
      return {
        startup: {
          name: candidate?.name ?? "Unknown",
          tagline: candidate?.tagline ?? "",
          description: candidate?.description ?? "",
          fundingStage: candidate?.fundingStage ?? "",
        },
        aiAnalysis: JSON.parse(JSON.stringify(analysis?.aiAnalysis ?? {})),
        matchScore: r.finalScore,
        rank: idx + 1,
      };
    });

    await reporter.generateReport(rankedForReport, bizPlan, searchId);

    yield {
      eventType: "stage_update",
      stageId: "stage-5",
      agentName: "Reporter",
      status: "running",
      progress: 80,
      message: "Compiling recommendations...",
    };

    await logStage(searchId, "Reporter", "complete", 100, "Report ready!", {
      durationMs: Date.now() - startReporter,
    });

    yield {
      eventType: "stage_complete",
      stageId: "stage-5",
      agentName: "Reporter",
      status: "complete",
      progress: 100,
      message: "Report ready!",
    };

    // ═══════════════════════════════════════════
    // Save Results to Database
    // ═══════════════════════════════════════════
    for (let i = 0; i < ranked.rankings.length; i++) {
      const r = ranked.rankings[i];
      const analysis = analyzed.find((a) => a.startupId === r.startupId);
      if (!analysis) continue;

      await prisma.searchResult.create({
        data: {
          searchExecutionId: searchId,
          startupId: r.startupId,
          matchScore: r.finalScore,
          confidence: r.confidence,
          aiAnalysis: JSON.parse(JSON.stringify(analysis.aiAnalysis)),
          rank: i + 1,
        },
      });
    }

    await prisma.searchExecution.update({
      where: { id: searchId },
      data: {
        status: "complete",
        resultCount: ranked.rankings.length,
      },
    });

    yield {
      eventType: "pipeline_complete",
      stageId: "stage-5",
      agentName: "Reporter",
      status: "complete",
      progress: 100,
      message: "Pipeline complete",
      data: { resultCount: ranked.rankings.length, searchId },
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
