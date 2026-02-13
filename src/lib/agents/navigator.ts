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
    // Fetch only the last 20 messages from DB (desc order), then reverse to chronological
    const recentMessages = await prisma.discoveryMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const historyMessages = recentMessages.reverse().map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    historyMessages.push({ role: "user", content: userMessage });

    let fullResponse = "";
    for await (const chunk of this.stream(DISCOVERY_SYSTEM, historyMessages)) {
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
