import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { BaseAgent } from "./base";
import { ScoutResultSchema, type ScoutResult } from "./schemas";
import { SCOUT_SYSTEM } from "./prompts/scout";
import { searchCompanies, getCompanyDetails } from "./tools";

export type ScoutEvent =
  | { type: "tool_call"; toolCallId: string; toolName: string; input: Record<string, unknown> }
  | { type: "tool_result"; toolCallId: string; toolName: string; resultSummary: string }
  | { type: "result"; data: ScoutResult };

export class ScoutAgent extends BaseAgent {
  constructor() {
    super("scout");
  }

  private buildTools() {
    return [
      betaZodTool({
        name: "search_companies",
        description:
          "Search the YC company database with optional filters. Returns up to 50 matching companies. Use multiple searches with different filter combinations for better coverage.",
        inputSchema: z.object({
          query: z
            .string()
            .optional()
            .describe("Text search on name, one-liner, and description"),
          industries: z
            .array(z.string())
            .optional()
            .describe("Filter by industries (e.g. ['B2B', 'Healthcare', 'Fintech'])"),
          tags: z
            .array(z.string())
            .optional()
            .describe("Filter by tags (e.g. ['machine-learning', 'saas', 'api'])"),
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
            .describe("Filter by regions (e.g. ['United States of America', 'Europe'])"),
          batch: z
            .string()
            .optional()
            .describe("Filter by YC batch (e.g. 'W25', 'S24')"),
          maxTeamSize: z
            .number()
            .optional()
            .describe("Maximum team size"),
          isHiring: z
            .boolean()
            .optional()
            .describe("Filter for companies currently hiring"),
          topCompany: z
            .boolean()
            .optional()
            .describe("Filter for top YC companies"),
        }),
        run: async (input) => JSON.stringify(await searchCompanies(input)),
      }),
      betaZodTool({
        name: "get_company_details",
        description:
          "Get detailed information about a specific YC company by numeric ID, including full description, all tags, regions, and metadata.",
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
    ];
  }

  private buildUserMessage(productDocument: string) {
    return `<product_document>
${productDocument}
</product_document>

Using your tools, search for YC companies that match this product document. Follow the search strategy described in your instructions: broad sweep, targeted search, deep dive, then rank and select.`;
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
    const messages = [{ role: "user" as const, content: this.buildUserMessage(productDocument) }];

    let fullText = "";
    const toolCallNames = new Map<string, string>();

    for await (const event of this.streamWithToolEvents(SCOUT_SYSTEM, messages, tools, { maxIterations: 15 })) {
      if (event.type === "text") {
        fullText += event.text;
      }
      if (event.type === "tool_call") {
        toolCallNames.set(event.id, event.name);
        yield { type: "tool_call", toolCallId: event.id, toolName: event.name, input: event.input };
      }
      if (event.type === "tool_result") {
        const toolName = toolCallNames.get(event.id) ?? "unknown";
        let summary = "Concluido";
        try {
          const content = typeof event.result === "string" ? event.result : JSON.stringify(event.result);
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            summary = `${parsed.length} resultados encontrados`;
          } else if (typeof parsed === "object" && parsed !== null) {
            summary = "Detalhes obtidos";
          }
        } catch { /* use default summary */ }
        yield { type: "tool_result", toolCallId: event.id, toolName, resultSummary: summary };
      }
    }

    const parsed = this.parseResult(fullText);
    if (parsed) {
      yield { type: "result", data: parsed };
    } else {
      const fallback = await this.invokeStructured(
        "Extract the company search results from this text into the required structured format.",
        fullText,
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
