import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { BaseAgent } from "./base";
import { ADVISOR_SYSTEM } from "./prompts/advisor";
import {
  type SessionContext,
  buildContextBlock,
} from "./context";
import { getCompanyDetails, searchCompanies } from "./tools";

export class AdvisorAgent extends BaseAgent {
  constructor() {
    super("advisor");
  }

  private buildTools() {
    return [
      betaZodTool({
        name: "get_company_details",
        description:
          "Get full details of a specific YC company including description, tags, regions, and metadata. Use when the user asks about a specific company.",
        inputSchema: z.object({
          companyId: z
            .number()
            .describe("The numeric YC company ID"),
        }),
        run: async (input) => {
          const result = await getCompanyDetails(input.companyId);
          return JSON.stringify(result ?? { error: "Company not found" });
        },
      }),
      betaZodTool({
        name: "search_companies",
        description:
          "Search YC companies with filters. Use when the user wants to explore different criteria.",
        inputSchema: z.object({
          query: z
            .string()
            .optional()
            .describe("Text search on name, one-liner, and description"),
          industries: z
            .array(z.string())
            .optional()
            .describe("Filter by industries"),
          tags: z
            .array(z.string())
            .optional()
            .describe("Filter by tags"),
          status: z
            .string()
            .optional()
            .describe("Filter by status: Active, Inactive, Acquired, or Public"),
          stage: z
            .string()
            .optional()
            .describe("Filter by stage: Early or Growth"),
          regions: z
            .array(z.string())
            .optional()
            .describe("Filter by regions"),
          maxTeamSize: z
            .number()
            .optional()
            .describe("Max team size"),
        }),
        run: async (input) => JSON.stringify(await searchCompanies(input)),
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
