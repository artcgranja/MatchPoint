import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { BaseAgent } from "./base";
import { ADVISOR_SYSTEM } from "./prompts/advisor";
import {
  type SessionContext,
  buildContextBlock,
} from "./context";
import { getStartupDetails, searchStartups } from "./tools";

export class AdvisorAgent extends BaseAgent {
  constructor() {
    super("advisor");
  }

  private buildTools() {
    return [
      betaZodTool({
        name: "get_startup_details",
        description:
          "Get full details of a specific startup including team, metrics, and funding. Use when the user asks about a specific startup.",
        inputSchema: z.object({
          startupId: z
            .string()
            .describe("The startup ID to look up"),
        }),
        run: async (input) => {
          const result = await getStartupDetails(input.startupId);
          return JSON.stringify(result ?? { error: "Startup not found" });
        },
      }),
      betaZodTool({
        name: "search_startups",
        description:
          "Search for startups in the database with filters. Use when the user wants to explore different criteria.",
        inputSchema: z.object({
          industries: z
            .array(z.string())
            .optional()
            .describe("Filter by industries"),
          technologies: z
            .array(z.string())
            .optional()
            .describe("Filter by technologies"),
          fundingStages: z
            .array(z.string())
            .optional()
            .describe("Filter by funding stages"),
          maxEmployees: z
            .number()
            .optional()
            .describe("Max number of employees"),
        }),
        run: async (input) => JSON.stringify(await searchStartups(input)),
      }),
    ];
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
      this.buildTools(),
      { maxIterations: 5 }
    )) {
      if (event.type === "text") {
        yield { text: event.text };
      }
    }
  }
}
