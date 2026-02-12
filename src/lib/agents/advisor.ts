import { BaseAgent } from "./base";
import { ADVISOR_SYSTEM } from "./prompts/advisor";
import {
  type SessionContext,
  buildContextBlock,
} from "./context";
import { composeToolsForAgent } from "./skills/registry";

export class AdvisorAgent extends BaseAgent {
  constructor() {
    super("advisor");
  }

  private getTools() {
    return composeToolsForAgent("advisor");
  }

  async *chat(
    context: SessionContext,
    userMessage: string
  ): AsyncGenerator<{ text: string }> {
    const systemPrompt = `${ADVISOR_SYSTEM}\n\n<session_context>\n${buildContextBlock(context)}\n</session_context>`;

    const messages: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [
      ...context.postPipelineMessages,
      { role: "user", content: userMessage },
    ];

    for await (const event of this.streamWithToolEvents(
      systemPrompt,
      messages,
      this.getTools(),
      { maxIterations: 5 }
    )) {
      if (event.type === "text") {
        yield { text: event.text };
      }
    }
  }
}
