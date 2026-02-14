import { prisma } from "@/lib/db";
import { DiscoveryAgent } from "./navigator";
import { AdvisorAgent } from "./advisor";
import { runAnalysis, runScout } from "./orchestrator";
import { assembleSessionContext } from "./context";
import type { QuestionAnswer, QuestionData } from "@/types";
import type { SsePayload } from "@/lib/sse/events";

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
  message: string,
  answers?: QuestionAnswer[]
): AsyncGenerator<SsePayload> {
  const state = await getSessionState(sessionId);

  switch (state.stage) {
    case "discovery":
      yield* handleDiscoveryMessage(sessionId, message, answers);
      break;

    case "awaiting_confirmation":
      yield* handleConfirmation(state.searchId!, message);
      break;

    case "complete":
      yield* handleAdvisorMessage(state.searchId!, message);
      break;

    case "analysis":
      // Analysis was interrupted (serverless process died) — re-run it
      yield {
        type: "status",
        agent: "system",
        message: "Restarting analysis...",
        key: "preparingAnalysis",
      };
      for await (const event of runAnalysis(state.searchId!)) {
        if (event.type === "error") {
          yield event;
          return;
        }
        yield event;
      }
      // Transition to awaiting_confirmation
      yield {
        type: "done",
        agent: "discovery",
        transition: "awaiting_confirmation",
        searchId: state.searchId!,
      };
      break;

    case "scouting":
      // Scout was interrupted — clean up incomplete data and re-run
      await prisma.searchResult.deleteMany({
        where: { searchExecutionId: state.searchId! },
      });
      await prisma.pipelineStageLog.deleteMany({
        where: { searchExecutionId: state.searchId!, agentName: "Scout" },
      });
      await prisma.searchExecution.update({
        where: { id: state.searchId! },
        data: { status: "idle", resultCount: 0, scoutSummary: null },
      });
      yield* runScout(state.searchId!);
      break;
  }
}

// ═══════════════════════════════════════════
// Discovery Handler (runs analysis inline)
// ═══════════════════════════════════════════

async function* handleDiscoveryMessage(
  sessionId: string,
  message: string,
  answers?: QuestionAnswer[]
): AsyncGenerator<SsePayload> {
  const session = await prisma.discoverySession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  // If answers are provided, mark the last questions message as answered
  if (answers && answers.length > 0) {
    // Find the latest message with metadata.type=questions, then check in code
    const latestQuestionsMsg = await prisma.discoveryMessage.findFirst({
      where: {
        sessionId,
        role: "assistant",
        metadata: { path: ["type"], equals: "questions" },
      },
      orderBy: { createdAt: "desc" },
    });

    if (latestQuestionsMsg) {
      const meta = latestQuestionsMsg.metadata as Record<string, unknown>;

      // Only update if not already answered (check in code, not DB query)
      if (!meta.answered) {
        // Filter out answers whose questionId doesn't match a real question
        const originalQuestions = (meta.questions ?? []) as Array<{ id: string }>;
        const validIds = new Set(originalQuestions.map((q) => q.id));
        const validAnswers = answers.filter((a) => {
          if (!validIds.has(a.questionId)) {
            console.warn(
              `[Discovery] Dropping answer with unknown questionId "${a.questionId}" in session ${sessionId}`
            );
            return false;
          }
          return true;
        });

        await prisma.discoveryMessage.update({
          where: { id: latestQuestionsMsg.id },
          data: {
            metadata: JSON.parse(JSON.stringify({
              ...meta,
              answered: true,
              answers: validAnswers,
            })),
          },
        });
      }
    }
  }

  // Save user message (with question_answers metadata if applicable)
  await prisma.discoveryMessage.create({
    data: {
      sessionId,
      role: "user",
      content: message,
      phase: session.currentPhase,
      ...(answers && answers.length > 0 && {
        metadata: JSON.parse(JSON.stringify({ type: "question_answers" })),
      }),
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
  let questionsPayload: { questions: QuestionData[]; context?: string } | null = null;

  for await (const event of discovery.chat(sessionId, message)) {
    if (event.type === "text") {
      fullResponse += event.text;
      yield { type: "text", agent: "discovery", text: event.text };
    } else if (event.type === "tool_start") {
      yield {
        type: "tool_start",
        agent: "discovery",
        toolName: event.name,
        toolCallId: event.id,
      };
    } else if (event.type === "tool_call") {
      yield {
        type: "tool_call",
        agent: "discovery",
        toolName: event.name,
        toolCallId: event.id,
        input: event.input,
      };
      if (event.name === "complete_discovery") {
        discoveryDone = true;
      }
    } else if (event.type === "tool_result") {
      yield {
        type: "tool_result",
        agent: "discovery",
        toolName: event.name,
        toolCallId: event.id,
      };
    } else if (event.type === "questions") {
      questionsPayload = { questions: event.questions, context: event.context };
    } else if (event.type === "done") {
      discoveryDone = true;
    }
  }

  // Save assistant message(s)
  // When questions exist with preceding text, split into two DB rows so reload
  // matches the live streaming experience (text bubble + questions card).
  const updatedSession = await prisma.discoverySession.findUnique({
    where: { id: sessionId },
  });
  const phase = updatedSession?.currentPhase ?? session.currentPhase;

  if (questionsPayload && fullResponse.trim()) {
    // Save text message first
    await prisma.discoveryMessage.create({
      data: { sessionId, role: "assistant", content: fullResponse, phase },
    });
    // Save questions message separately (empty content, metadata carries questions)
    await prisma.discoveryMessage.create({
      data: {
        sessionId,
        role: "assistant",
        content: "",
        phase,
        metadata: JSON.parse(JSON.stringify({
          type: "questions",
          questions: questionsPayload.questions,
          context: questionsPayload.context,
        })),
      },
    });
  } else if (questionsPayload) {
    // Questions with no preceding text — single message
    await prisma.discoveryMessage.create({
      data: {
        sessionId,
        role: "assistant",
        content: "",
        phase,
        metadata: JSON.parse(JSON.stringify({
          type: "questions",
          questions: questionsPayload.questions,
          context: questionsPayload.context,
        })),
      },
    });
  } else {
    // Regular assistant message (no questions)
    await prisma.discoveryMessage.create({
      data: { sessionId, role: "assistant", content: fullResponse, phase },
    });
  }

  if (questionsPayload) {
    yield { type: "questions", agent: "discovery", questions: questionsPayload.questions, context: questionsPayload.context };
  }

  if (discoveryDone) {
    // Extract NeedSummary and mark session complete
    const needSummary = await discovery.extractNeedSummary(sessionId);
    await prisma.discoverySession.update({
      where: { id: sessionId },
      data: {
        isComplete: true,
        currentPhase: "complete",
        bizPlan: JSON.parse(JSON.stringify(needSummary)),
      },
    });

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

    yield { type: "status", agent: "system", message: "Discovery complete! Starting analysis...", key: "discoveryComplete" };

    // Run analysis inline — same SSE stream (orchestrator yields SsePayload directly)
    for await (const event of runAnalysis(search.id)) {
      if (event.type === "error") {
        yield event;
        return;
      }
      yield event;
    }

    // Analysis done → awaiting user confirmation
    yield {
      type: "done",
      agent: "discovery",
      transition: "awaiting_confirmation",
      searchId: search.id,
    };
  } else {
    yield { type: "done", agent: "discovery" };
  }
}

// ═══════════════════════════════════════════
// Confirmation Handler
// ═══════════════════════════════════════════

async function* handleConfirmation(
  searchId: string,
  message: string
): AsyncGenerator<SsePayload> {
  // Save the confirmation message
  await prisma.orchestratorMessage.create({
    data: {
      searchExecutionId: searchId,
      role: "user",
      content: message,
    },
  });

  // Any message in awaiting_confirmation state triggers Scout
  // Orchestrator yields SsePayload directly
  yield* runScout(searchId);
}

// ═══════════════════════════════════════════
// Advisor Handler (post-pipeline Q&A)
// ═══════════════════════════════════════════

async function* handleAdvisorMessage(
  searchId: string,
  message: string
): AsyncGenerator<SsePayload> {
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

  for await (const event of advisor.chat(context, message)) {
    if (event.type === "text") {
      fullText += event.text;
      yield { type: "text", agent: "advisor", text: event.text };
    } else if (event.type === "tool_start") {
      yield {
        type: "tool_start",
        agent: "advisor",
        toolName: event.name,
        toolCallId: event.id,
      };
    } else if (event.type === "tool_call") {
      yield {
        type: "tool_call",
        agent: "advisor",
        toolName: event.name,
        toolCallId: event.id,
        input: event.input,
      };
    } else if (event.type === "tool_result") {
      yield {
        type: "tool_result",
        agent: "advisor",
        toolName: event.name,
        toolCallId: event.id,
      };
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

  yield { type: "done", agent: "advisor" };
}
