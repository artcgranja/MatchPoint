import { z } from "zod";
import { toJSONSchema } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { BaseAgent, type ToolDefinition } from "./base";
import { ScoutResultSchema, type ScoutResult } from "./schemas";
import { SCOUT_SYSTEM } from "./prompts/scout";
import { searchStartups, getStartupDetails } from "./tools";

export class ScoutAgent extends BaseAgent {
  constructor() {
    super("scout");
  }

  async search(productDocument: string): Promise<ScoutResult> {
    const tools: ToolDefinition[] = [
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

    const userMessage = `<product_document>
${productDocument}
</product_document>

Using your tools, search for startups that match this product document. Follow the search strategy described in your instructions: broad sweep, narrow focus, deep dive, then rank and select.`;

    const { text } = await this.invokeWithTools(
      SCOUT_SYSTEM,
      [{ role: "user", content: userMessage }],
      tools,
      { maxTurns: 15 }
    );

    // Extract JSON from the response text
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text;

    try {
      const parsed = JSON.parse(jsonStr);
      return ScoutResultSchema.parse(parsed);
    } catch {
      // Fallback: use invokeStructured to extract from the text
      return this.invokeStructured(
        "Extract the startup search results from this text into the required structured format.",
        text,
        ScoutResultSchema
      );
    }
  }
}
