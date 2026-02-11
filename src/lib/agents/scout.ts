import { z } from "zod";
import { toJSONSchema } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { BaseAgent, type ToolDefinition } from "./base";
import { ScoutResultSchema, type ScoutResult } from "./schemas";
import { SCOUT_SYSTEM } from "./prompts/scout";
import { searchStartups, getStartupDetails } from "./tools";

export type ScoutEvent =
  | { type: "tool_call"; toolCallId: string; toolName: string; input: Record<string, unknown> }
  | { type: "tool_result"; toolCallId: string; toolName: string; resultSummary: string }
  | { type: "result"; data: ScoutResult };

export class ScoutAgent extends BaseAgent {
  constructor() {
    super("scout");
  }

  private buildTools(): ToolDefinition[] {
    return [
      {
        name: "search_startups",
        description:
          "Search the startup database with optional filters. Returns a list of matching startups with basic info. Use multiple searches with different filter combinations for better coverage.",
        input_schema: toJSONSchema(
          z.object({
            industries: z
              .array(z.string())
              .optional()
              .describe("Filter by industries (e.g. ['Logistics', 'FinTech'])"),
            technologies: z
              .array(z.string())
              .optional()
              .describe("Filter by technologies (e.g. ['Machine Learning', 'IoT'])"),
            fundingStages: z
              .array(z.string())
              .optional()
              .describe("Filter by funding stages (e.g. ['Seed', 'Series A'])"),
            maxEmployees: z
              .number()
              .optional()
              .describe("Maximum number of employees"),
          })
        ) as Anthropic.Messages.Tool.InputSchema,
        handler: async (input) => {
          return searchStartups({
            industries: input.industries as string[] | undefined,
            technologies: input.technologies as string[] | undefined,
            fundingStages: input.fundingStages as string[] | undefined,
            maxEmployees: input.maxEmployees as number | undefined,
          });
        },
      },
      {
        name: "get_startup_details",
        description:
          "Get detailed information about a specific startup by ID, including team members, full metrics, and complete description.",
        input_schema: toJSONSchema(
          z.object({
            startupId: z
              .string()
              .describe("The database ID of the startup to inspect"),
          })
        ) as Anthropic.Messages.Tool.InputSchema,
        handler: async (input) => {
          return getStartupDetails(input.startupId as string);
        },
      },
    ];
  }

  private buildUserMessage(productDocument: string) {
    return `<product_document>
${productDocument}
</product_document>

Using your tools, search for startups that match this product document. Follow the search strategy described in your instructions: broad sweep, narrow focus, deep dive, then rank and select.`;
  }

  private parseResult(text: string): ScoutResult | null {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text;
    try {
      const parsed = JSON.parse(jsonStr);
      return ScoutResultSchema.parse(parsed);
    } catch {
      return null;
    }
  }

  async *searchWithEvents(productDocument: string): AsyncGenerator<ScoutEvent> {
    const tools = this.buildTools();
    const events: ScoutEvent[] = [];

    const { text } = await this.invokeWithTools(
      SCOUT_SYSTEM,
      [{ role: "user", content: this.buildUserMessage(productDocument) }],
      tools,
      {
        maxTurns: 15,
        onToolCall: (toolName, input, id) => {
          const event: ScoutEvent = { type: "tool_call", toolCallId: id, toolName, input };
          events.push(event);
        },
        onToolResult: (id, result) => {
          const resultArray = Array.isArray(result) ? result : [];
          const summary = resultArray.length > 0
            ? `${resultArray.length} resultados encontrados`
            : typeof result === "object" && result !== null
              ? "Detalhes obtidos"
              : "Concluido";
          // Find the matching tool_call to get the toolName
          const callEvent = events.find(
            (e) => e.type === "tool_call" && e.toolCallId === id
          );
          const toolName = callEvent && callEvent.type === "tool_call"
            ? callEvent.toolName
            : "unknown";
          events.push({ type: "tool_result", toolCallId: id, toolName, resultSummary: summary });
        },
      }
    );

    // Yield all collected events
    for (const event of events) {
      yield event;
    }

    // Parse result
    const parsed = this.parseResult(text);
    if (parsed) {
      yield { type: "result", data: parsed };
    } else {
      const fallback = await this.invokeStructured(
        "Extract the startup search results from this text into the required structured format.",
        text,
        ScoutResultSchema
      );
      yield { type: "result", data: fallback };
    }
  }

  async search(productDocument: string): Promise<ScoutResult> {
    let result: ScoutResult | null = null;
    for await (const event of this.searchWithEvents(productDocument)) {
      if (event.type === "result") {
        result = event.data;
      }
    }
    if (!result) {
      throw new Error("Scout search did not produce a result");
    }
    return result;
  }
}
