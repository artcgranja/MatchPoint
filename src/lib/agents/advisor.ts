import { toJSONSchema } from "zod";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { BaseAgent, type ToolDefinition } from "./base";
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

  private getTools(): ToolDefinition[] {
    return [
      {
        name: "get_startup_details",
        description:
          "Get full details of a specific startup including team, metrics, and funding. Use when the user asks about a specific startup.",
        input_schema: toJSONSchema(
          z.object({
            startupId: z
              .string()
              .describe("The startup ID to look up"),
          })
        ) as Anthropic.Messages.Tool.InputSchema,
        handler: async (input) => {
          const result = await getStartupDetails(
            input.startupId as string
          );
          return result ?? { error: "Startup not found" };
        },
      },
      {
        name: "search_startups",
        description:
          "Search for startups in the database with filters. Use when the user wants to explore different criteria.",
        input_schema: toJSONSchema(
          z.object({
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
    ];
  }

  async chat(
    context: SessionContext,
    userMessage: string
  ): Promise<{ text: string }> {
    const systemPrompt = `${ADVISOR_SYSTEM}\n\n<session_context>\n${buildContextBlock(context)}\n</session_context>`;

    const messages: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [
      ...context.postPipelineMessages,
      { role: "user", content: userMessage },
    ];

    const { text } = await this.invokeWithTools(
      systemPrompt,
      messages,
      this.getTools(),
      { maxTurns: 5 }
    );

    return { text };
  }
}
