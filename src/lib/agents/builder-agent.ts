import { BaseAgent, type ToolStreamEvent } from "./base";
import type { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta";
import type { BetaRunnableTool } from "@anthropic-ai/sdk/lib/tools/BetaRunnableTool";
import {
  BUILDER_SYSTEM_PROMPT,
  BUILDER_NEXTJS_PROMPT,
  BUILDER_FASTAPI_PROMPT,
  BUILDER_AGENT_WORKFLOW_PROMPT,
} from "./prompts/builder";

type Template = "nextjs_webapp" | "python_fastapi" | "agent_workflow" | "blank";

const TEMPLATE_PROMPTS: Record<Template, string> = {
  nextjs_webapp: BUILDER_NEXTJS_PROMPT,
  python_fastapi: BUILDER_FASTAPI_PROMPT,
  agent_workflow: BUILDER_AGENT_WORKFLOW_PROMPT,
  blank: BUILDER_SYSTEM_PROMPT,
};

export class BuilderAgent extends BaseAgent {
  constructor() {
    super("builder"); // Uses Opus 4.6 for maximum reasoning
  }

  async *chat(
    messages: BetaMessageParam[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: BetaRunnableTool<any>[],
    template: Template = "blank"
  ): AsyncGenerator<ToolStreamEvent> {
    const systemPrompt = TEMPLATE_PROMPTS[template] ?? BUILDER_SYSTEM_PROMPT;

    yield* this.streamWithToolEvents(systemPrompt, messages, tools, {
      maxTokens: 16384,
      maxIterations: 30,
      cacheTtl: "1h",
    });
  }
}
