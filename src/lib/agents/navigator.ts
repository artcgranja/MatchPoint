import { BaseAgent } from "./base";
import { NeedSummarySchema, type NeedSummary } from "./schemas";
import { DISCOVERY_SYSTEM, DISCOVERY_EXTRACT_SYSTEM } from "./prompts/navigator";
import { prisma } from "@/lib/db";

export class DiscoveryAgent extends BaseAgent {
  constructor() {
    super("discovery");
  }

  async *chat(
    sessionId: string,
    userMessage: string
  ): AsyncGenerator<{ text?: string; done?: boolean }> {
    const session = await prisma.discoverySession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    const historyMessages = session.messages.slice(-20).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    historyMessages.push({ role: "user", content: userMessage });

    const systemWithContext = `${DISCOVERY_SYSTEM}

Messages exchanged so far: ${session.messages.length}`;

    let fullResponse = "";
    for await (const chunk of this.stream(systemWithContext, historyMessages)) {
      fullResponse += chunk;
      yield { text: chunk };
    }

    // Check if discovery is complete
    if (fullResponse.includes("[DISCOVERY_COMPLETE]")) {
      const needSummary = await this.extractNeedSummary(sessionId);
      await prisma.discoverySession.update({
        where: { id: sessionId },
        data: {
          isComplete: true,
          currentPhase: "complete",
          bizPlan: JSON.parse(JSON.stringify(needSummary)),
        },
      });
      yield { done: true };
    }
  }

  async extractNeedSummary(sessionId: string): Promise<NeedSummary> {
    const session = await prisma.discoverySession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    const conversation = session.messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    return this.invokeStructured(
      DISCOVERY_EXTRACT_SYSTEM,
      `Here is the complete discovery conversation:\n\n${conversation}\n\nExtract a structured NeedSummary from this conversation.`,
      NeedSummarySchema
    );
  }
}
