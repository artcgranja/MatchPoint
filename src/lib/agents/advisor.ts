import { BaseAgent } from "./base";
import { ADVISOR_SYSTEM } from "./prompts/advisor";
import { type SessionContext, buildContextBlock } from "./context";
import { composeToolsForAgent } from "./skills/registry";

export type AdvisorEvent =
  | { type: "text"; text: string }
  | { type: "tool_start"; name: string; id: string }
  | { type: "tool_call"; name: string; id: string; input: Record<string, unknown> }
  | { type: "tool_result"; name: string; id: string; result: unknown };

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
  ): AsyncGenerator<AdvisorEvent> {
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
        yield { type: "text", text: event.text };
      } else if (event.type === "tool_start") {
        yield { type: "tool_start", name: event.name, id: event.id };
      } else if (event.type === "tool_call") {
        yield { type: "tool_call", name: event.name, id: event.id, input: event.input };
      } else if (event.type === "tool_result") {
        yield { type: "tool_result", name: event.name, id: event.id, result: event.result };
      }
    }
  }
}
