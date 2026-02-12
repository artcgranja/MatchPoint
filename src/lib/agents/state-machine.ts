import { prisma } from "@/lib/db";
import { DiscoveryAgent } from "./navigator";
import { AdvisorAgent } from "./advisor";
import { runAnalysis, runScout, type PipelineEvent } from "./orchestrator";
import { assembleSessionContext } from "./context";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export type ConductorStage =
  | "discovery"
  | "analysis"
  | "awaiting_confirmation"
  | "scouting"
  | "complete";

interface SessionState {
  stage: ConductorStage;
  sessionId: string;
  searchId: string | null;
}

export type ConductorEvent =
  | { type: "text"; text: string }
  | { type: "done"; transition?: "awaiting_confirmation"; searchId?: string }
  | { type: "analysis_thinking"; text: string }
  | { type: "analysis_text"; text: string }
  | { type: "analysis_complete"; data: { productDocument: string } }
  | { type: "scout_event"; event: PipelineEvent }
  | { type: "advisor_text"; text: string }
  | { type: "advisor_done" }
  | { type: "error"; message: string }
  | { type: "status"; message: string };

// ═══════════════════════════════════════════
// State Resolution (deterministic, no LLM)
// ═══════════════════════════════════════════

export async function getSessionState(
  sessionId: string
): Promise<SessionState> {
  const session = await prisma.discoverySession.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      searches: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // No search yet → discovery
  if (!session.isComplete || session.searches.length === 0) {
    return { stage: "discovery", sessionId, searchId: null };
  }

  const search = session.searches[0];

  // Search exists but no bizPlan → analysis in progress
  if (!search.bizPlan) {
    return { stage: "analysis", sessionId, searchId: search.id };
  }

  // BizPlan exists, status still idle or running (pre-scout)
  if (search.status === "idle" || search.status === "running") {
    // Check if scout is running (status=running + bizPlan exists)
    const hasScoutLog = await prisma.pipelineStageLog.findFirst({
      where: { searchExecutionId: search.id, agentName: "Scout" },
    });

    if (hasScoutLog && search.status === "running") {
      return { stage: "scouting", sessionId, searchId: search.id };
    }

    return {
      stage: "awaiting_confirmation",
      sessionId,
      searchId: search.id,
    };
  }

  // Pipeline complete
  if (search.status === "complete") {
    return { stage: "complete", sessionId, searchId: search.id };
  }

  // Error state — treat as complete for advisor access
  return { stage: "complete", sessionId, searchId: search.id };
}

// ═══════════════════════════════════════════
// Main Router
// ═══════════════════════════════════════════

export async function* handleMessage(
  sessionId: string,
  message: string
): AsyncGenerator<ConductorEvent> {
  const state = await getSessionState(sessionId);

  switch (state.stage) {
    case "discovery":
      yield* handleDiscoveryMessage(sessionId, message);
      break;

    case "awaiting_confirmation":
      yield* handleConfirmation(state.searchId!, message);
      break;

    case "complete":
      yield* handleAdvisorMessage(state.searchId!, message);
      break;

    case "analysis":
      yield {
        type: "status",
        message: "Analise em andamento, aguarde...",
      };
      break;

    case "scouting":
      yield {
        type: "status",
        message: "Busca de startups em andamento, aguarde...",
      };
      break;
  }
}

// ═══════════════════════════════════════════
// Discovery Handler (runs analysis inline)
// ═══════════════════════════════════════════

async function* handleDiscoveryMessage(
  sessionId: string,
  message: string
): AsyncGenerator<ConductorEvent> {
  const session = await prisma.discoverySession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  // Save user message
  await prisma.discoveryMessage.create({
    data: {
      sessionId,
      role: "user",
      content: message,
      phase: session.currentPhase,
    },
  });

  // Auto-generate title from first user message
  if (!session.title) {
    const messageCount = await prisma.discoveryMessage.count({
      where: { sessionId, role: "user" },
    });
    if (messageCount === 1) {
      await prisma.discoverySession.update({
        where: { id: sessionId },
        data: { title: message.slice(0, 80) },
      });
    }
  }

  const discovery = new DiscoveryAgent();
  let fullResponse = "";
  let discoveryDone = false;

  for await (const chunk of discovery.chat(sessionId, message)) {
    if (chunk.text) {
      fullResponse += chunk.text;
      yield { type: "text", text: chunk.text };
    }
    if (chunk.done) {
      discoveryDone = true;
    }
  }

  // Save assistant message
  const updatedSession = await prisma.discoverySession.findUnique({
    where: { id: sessionId },
  });
  await prisma.discoveryMessage.create({
    data: {
      sessionId,
      role: "assistant",
      content: fullResponse,
      phase: updatedSession?.currentPhase ?? session.currentPhase,
    },
  });

  if (discoveryDone) {
    // Create SearchExecution
    const search = await prisma.searchExecution.create({
      data: {
        userId: session.userId,
        painPoint: "Discovery-based search",
        filters: {},
        status: "idle",
        discoverySessionId: sessionId,
      },
    });

    yield { type: "status", message: "Descoberta completa! Iniciando analise..." };

    // Run analysis inline — same SSE stream
    for await (const event of runAnalysis(search.id)) {
      switch (event.eventType) {
        case "analysis_thinking":
          yield {
            type: "analysis_thinking",
            text: (event.data as { text: string } | undefined)?.text ?? "",
          };
          break;
        case "analysis_text":
          yield {
            type: "analysis_text",
            text: (event.data as { text: string } | undefined)?.text ?? "",
          };
          break;
        case "analysis_complete":
          yield {
            type: "analysis_complete",
            data: {
              productDocument:
                (event.data as { productDocument: string } | undefined)?.productDocument ?? "",
            },
          };
          break;
        case "error":
          yield { type: "error", message: event.message };
          return;
      }
    }

    // Analysis done → awaiting user confirmation
    yield {
      type: "done",
      transition: "awaiting_confirmation",
      searchId: search.id,
    };
  } else {
    yield { type: "done" };
  }
}

// ═══════════════════════════════════════════
// Confirmation Handler
// ═══════════════════════════════════════════

async function* handleConfirmation(
  searchId: string,
  message: string
): AsyncGenerator<ConductorEvent> {
  // Save the confirmation message
  await prisma.orchestratorMessage.create({
    data: {
      searchExecutionId: searchId,
      role: "user",
      content: message,
    },
  });

  // Any message in awaiting_confirmation state triggers Scout
  for await (const event of runScout(searchId)) {
    yield { type: "scout_event", event };
  }
}

// ═══════════════════════════════════════════
// Advisor Handler (post-pipeline Q&A)
// ═══════════════════════════════════════════

async function* handleAdvisorMessage(
  searchId: string,
  message: string
): AsyncGenerator<ConductorEvent> {
  // Save user message
  await prisma.orchestratorMessage.create({
    data: {
      searchExecutionId: searchId,
      role: "user",
      content: message,
    },
  });

  const context = await assembleSessionContext(searchId);
  const advisor = new AdvisorAgent();
  let fullText = "";

  for await (const chunk of advisor.chat(context, message)) {
    if (chunk.text) {
      fullText += chunk.text;
      yield { type: "advisor_text", text: chunk.text };
    }
  }

  // Save assistant message
  await prisma.orchestratorMessage.create({
    data: {
      searchExecutionId: searchId,
      role: "assistant",
      content: fullText,
    },
  });

  yield { type: "advisor_done" };
}
