import { BaseAgent, type ToolStreamEvent } from "./base";
import { NeedSummarySchema, type NeedSummary } from "./schemas";
import { DISCOVERY_SYSTEM, DISCOVERY_EXTRACT_SYSTEM } from "./prompts/navigator";
import { composeToolsForAgent } from "./skills/registry";
import { prisma } from "@/lib/db";
import type { QuestionData } from "@/types";

export type DiscoveryEvent =
  | { type: "text"; text: string }
  | { type: "tool_call"; name: string; input: Record<string, unknown> }
  | { type: "questions"; questions: QuestionData[]; context?: string }
  | { type: "done" };

export class DiscoveryAgent extends BaseAgent {
  constructor() {
    super("discovery");
  }

  async *chat(
    sessionId: string,
    userMessage: string
  ): AsyncGenerator<DiscoveryEvent> {
    // Fetch only the last 20 messages from DB (desc order), then reverse to chronological
    const recentMessages = await prisma.discoveryMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const historyMessages = recentMessages
      .reverse()
      .filter((m) => m.content.trim().length > 0)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    historyMessages.push({ role: "user", content: userMessage });

    const tools = composeToolsForAgent("discovery");
    let discoveryComplete = false;
    let questionsData: { questions: QuestionData[]; context?: string } | null = null;

    for await (const event of this.streamWithToolEvents(
      DISCOVERY_SYSTEM,
      historyMessages,
      tools,
      { maxIterations: 5 }
    )) {
      if (event.type === "text") {
        yield { type: "text", text: event.text };
      } else if (event.type === "tool_call" && event.name === "complete_discovery") {
        discoveryComplete = true;
        yield { type: "tool_call", name: event.name, input: event.input };
      } else if (event.type === "tool_call" && event.name === "ask_questions") {
        questionsData = event.input as { questions: QuestionData[]; context?: string };
      }
    }

    if (questionsData) {
      yield { type: "questions", questions: questionsData.questions, context: questionsData.context };
    }

    if (discoveryComplete) {
      yield { type: "done" };
    }
  }

  async extractNeedSummary(sessionId: string): Promise<NeedSummary> {
    const allMessages = await prisma.discoveryMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    const conversation = allMessages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    return this.invokeStructured(
      DISCOVERY_EXTRACT_SYSTEM,
      `Here is the complete discovery conversation:\n\n${conversation}\n\nExtract a structured NeedSummary from this conversation.`,
      NeedSummarySchema
    );
  }
}
