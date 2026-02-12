import { BaseAgent } from "./base";
import { ADVISOR_SYSTEM } from "./prompts/advisor";
import { type SessionContext, buildContextBlock } from "./context";
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
    const contextBlock = buildContextBlock(context);

    const messages: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [
      { role: "user", content: `<session_context>\n${contextBlock}\n</session_context>` },
      { role: "assistant", content: "Understood. I have the full session context." },
      ...context.postPipelineMessages,
      { role: "user", content: userMessage },
    ];

    for await (const event of this.streamWithToolEvents(
      ADVISOR_SYSTEM,
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
