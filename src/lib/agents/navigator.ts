import { BaseAgent } from "./base";
import { BizPlanSchema, type BizPlan } from "./schemas";
import {
  NAVIGATOR_SCOPE_SYSTEM,
  NAVIGATOR_BIZPLAN_SYSTEM,
  NAVIGATOR_QUICK_SYSTEM,
} from "./prompts/navigator";
import { prisma } from "@/lib/db";
import type { ScopePhase } from "@prisma/client";

const PHASE_ORDER: ScopePhase[] = [
  "situation",
  "challenge",
  "objectives",
  "parameters",
  "evaluation",
  "complete",
];

export class NavigatorAgent extends BaseAgent {
  constructor() {
    super("navigator");
  }

  async *conductScopeTurn(
    sessionId: string,
    userMessage: string
  ): AsyncGenerator<{ text?: string; phase?: string }> {
    const session = await prisma.discoverySession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    // Build message history (last 20 messages to manage context)
    const historyMessages = session.messages.slice(-20).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Add current user message
    historyMessages.push({ role: "user", content: userMessage });

    // Add phase context to system prompt
    const systemWithContext = `${NAVIGATOR_SCOPE_SYSTEM}

Current phase: ${session.currentPhase}
Messages exchanged so far: ${session.messages.length}

When you've gathered enough information for the current phase, indicate you're moving to the next phase by including one of these markers in your response:
[PHASE: challenge]
[PHASE: objectives]
[PHASE: parameters]
[PHASE: evaluation]
[PHASE: complete]`;

    let fullResponse = "";
    for await (const chunk of this.stream(systemWithContext, historyMessages)) {
      fullResponse += chunk;
      yield { text: chunk };
    }

    // Check if phase should advance
    const phaseMatch = fullResponse.match(/\[PHASE:\s*(\w+)\]/);
    if (phaseMatch) {
      const newPhase = phaseMatch[1] as ScopePhase;
      if (PHASE_ORDER.includes(newPhase)) {
        await prisma.discoverySession.update({
          where: { id: sessionId },
          data: {
            currentPhase: newPhase,
            isComplete: newPhase === "complete",
          },
        });
        yield { phase: newPhase };
      }
    }

    // If discovery is complete, generate BizPlan
    if (fullResponse.includes("[PHASE: complete]")) {
      const bizPlan = await this.extractBizPlan(sessionId);
      await prisma.discoverySession.update({
        where: { id: sessionId },
        data: { bizPlan: JSON.parse(JSON.stringify(bizPlan)) },
      });
    }
  }

  async extractBizPlan(sessionId: string): Promise<BizPlan> {
    const session = await prisma.discoverySession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    const conversation = session.messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    return this.invokeStructured(
      NAVIGATOR_BIZPLAN_SYSTEM,
      `Here is the complete SCOPE discovery conversation:\n\n${conversation}\n\nPlease synthesize this into a structured BizPlan.`,
      BizPlanSchema
    );
  }

  async generateBizPlan(painPoint: string): Promise<BizPlan> {
    return this.invokeStructured(
      NAVIGATOR_QUICK_SYSTEM,
      `The user's pain point is:\n\n"${painPoint}"\n\nGenerate a comprehensive BizPlan for startup matching based on this pain point.`,
      BizPlanSchema
    );
  }
}
