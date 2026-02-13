import { prisma } from "@/lib/db";
import { BizDevAgent } from "./bizdev";
import { ScoutAgent } from "./scout";
import type { StartupCard } from "./schemas";

export interface PipelineEvent {
  eventType: string;
  stageId: string;
  agentName: string;
  status: string;
  progress: number;
  message: string;
  key?: string;
  params?: Record<string, string | number>;
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
    include: { discoverySession: true },
  });

  await prisma.searchExecution.update({
    where: { id: searchId },
    data: { status: "running" },
  });

  try {
    if (!search.discoverySession) {
      throw new Error("No discovery conversation found for this search");
    }

    // Load transcript messages with safety cap
    const transcriptMessages = await prisma.discoveryMessage.findMany({
      where: { sessionId: search.discoverySession.id },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    if (!transcriptMessages.length) {
      throw new Error("No discovery conversation found for this search");
    }

    // Build conversation transcript from discovery messages
    const conversationTranscript = transcriptMessages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n\n");

    // Extract NeedSummary for Analysis context
    const needSummary = search.discoverySession.bizPlan
      ? (search.discoverySession.bizPlan as unknown as import("./schemas").NeedSummary)
      : undefined;

    yield {
      eventType: "stage_update",
      stageId: "stage-1",
      agentName: "Analysis",
      status: "running",
      progress: 0,
      message: "Preparing BizDev plan...",
      key: "preparingAnalysis",
    };
    await logStage(searchId, "Analysis", "running", 0, "Starting BizDev analysis...");

    const startAnalysis = Date.now();
    const bizDevAgent = new BizDevAgent();
    let fullPlanText = "";

    // Stream thinking + text chunks — BizDev receives transcript + NeedSummary
    for await (const chunk of bizDevAgent.streamPlan(conversationTranscript, needSummary)) {
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

    // Save product document text directly to SearchExecution (no structured extraction)
    await prisma.searchExecution.update({
      where: { id: searchId },
      data: { bizPlan: JSON.parse(JSON.stringify({ productDocument: fullPlanText })) },
    });

    await logStage(searchId, "Analysis", "complete", 100, "BizDev plan complete", {
      durationMs: Date.now() - startAnalysis,
      output: { productDocument: fullPlanText },
    });

    yield {
      eventType: "analysis_complete",
      stageId: "stage-1",
      agentName: "Analysis",
      status: "complete",
      progress: 100,
      message: "BizDev plan complete",
      key: "analysisComplete",
      data: { productDocument: fullPlanText },
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
  });

  try {
    // Read product document from saved bizPlan
    const bizPlan = search.bizPlan as unknown as { productDocument?: string } | null;
    if (!bizPlan?.productDocument) {
      throw new Error("No product document found for this search");
    }
    const productDocument = bizPlan.productDocument;

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
      message: "Searching startups...",
      key: "searchingStartups",
    };
    await logStage(searchId, "Scout", "running", 0, "Searching startup databases...");

    const startScout = Date.now();
    const scoutAgent = new ScoutAgent();

    let scoutResult: { cards: StartupCard[]; summary: string } | null = null;
    let toolCallCount = 0;

    for await (const event of scoutAgent.searchWithEvents(productDocument)) {
      if (event.type === "tool_call") {
        toolCallCount++;
        // Granular progress: roughly map tool calls to 10-80% range
        const progress = Math.min(10 + toolCallCount * 15, 80);

        yield {
          eventType: "scout_tool_call",
          stageId: "stage-2",
          agentName: "Scout",
          status: "running",
          progress,
          message: event.toolName === "search_startups"
            ? "Searching database..."
            : "Analyzing details...",
          key: event.toolName === "search_startups"
            ? "searchingDatabase"
            : "analyzingDetails",
          data: {
            toolCallId: event.toolCallId,
            toolName: event.toolName,
            input: event.input as unknown as Record<string, unknown>,
          },
        };

        yield {
          eventType: "stage_update",
          stageId: "stage-2",
          agentName: "Scout",
          status: "running",
          progress,
          message: event.toolName === "search_startups"
            ? "Searching database..."
            : "Analyzing details...",
          key: event.toolName === "search_startups"
            ? "searchingDatabase"
            : "analyzingDetails",
        };
      }

      if (event.type === "tool_result") {
        yield {
          eventType: "scout_tool_result",
          stageId: "stage-2",
          agentName: "Scout",
          status: "running",
          progress: Math.min(10 + toolCallCount * 15, 80),
          message: event.resultSummary,
          data: {
            toolCallId: event.toolCallId,
            toolName: event.toolName,
            resultSummary: event.resultSummary,
          },
        };
      }

      if (event.type === "result") {
        scoutResult = event.data;
      }
    }

    if (!scoutResult) {
      throw new Error("Scout search did not produce a result");
    }

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
      message: `${scoutResult.cards.length} startups found`,
      key: "startupsFound",
      params: { count: scoutResult.cards.length },
    };

    // Validate company IDs exist before inserting (defense against hallucinated IDs)
    if (scoutResult.cards.length > 0) {
      const cardIds = scoutResult.cards.map((c) => c.id);
      const existingCompanies = await prisma.company.findMany({
        where: { id: { in: cardIds } },
        select: { id: true },
      });
      const validIds = new Set(existingCompanies.map((c) => c.id));
      const invalidIds = cardIds.filter((id) => !validIds.has(id));

      if (invalidIds.length > 0) {
        console.warn(`[Scout] Hallucinated company IDs filtered out: ${invalidIds.join(", ")}`);
        await logStage(searchId, "Scout", "running", 95, `Filtered ${invalidIds.length} hallucinated IDs`, {
          output: { hallucinatedIds: invalidIds, validCount: validIds.size },
        });
        // Update scoutResult to contain only valid cards
        scoutResult = {
          ...scoutResult,
          cards: scoutResult.cards.filter((c) => validIds.has(c.id)),
        };
      }

      if (scoutResult.cards.length > 0) {
        await prisma.searchResult.createMany({
          data: scoutResult.cards.map((card, i) => ({
            searchExecutionId: searchId,
            companyId: card.id,
            matchScore: 0,
            confidence: 0,
            aiAnalysis: { whyRelevant: card.whyRelevant } as never,
            rank: i + 1,
          })),
        });
      }
    }

    await prisma.searchExecution.update({
      where: { id: searchId },
      data: {
        status: "complete",
        resultCount: scoutResult.cards.length,
        scoutSummary: scoutResult.summary,
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
