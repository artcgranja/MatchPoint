import { BaseAgent } from "./base";
import { ScoutResultSchema, type ScoutResult } from "./schemas";
import { SCOUT_SYSTEM } from "./prompts/scout";
import { composeToolsForAgent } from "./skills/registry";

export type ScoutEvent =
  | { type: "tool_call"; toolCallId: string; toolName: string; input: Record<string, unknown> }
  | { type: "tool_result"; toolCallId: string; toolName: string; resultSummary: string }
  | { type: "result"; data: ScoutResult };

export class ScoutAgent extends BaseAgent {
  constructor() {
    super("scout");
  }

  private getTools() {
    return composeToolsForAgent("scout");
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
      const result = ScoutResultSchema.safeParse(parsed);
      if (!result.success) {
        console.warn("[Scout] JSON parsed but failed schema validation:", result.error.issues);
        return null;
      }
      return result.data;
    } catch {
      return null;
    }
  }

  async *searchWithEvents(productDocument: string): AsyncGenerator<ScoutEvent> {
    const tools = this.getTools();
    const messages = [{ role: "user" as const, content: this.buildUserMessage(productDocument) }];

    let fullText = "";
    const toolCallNames = new Map<string, string>();
    const collectedToolResults: { toolName: string; result: string }[] = [];

    for await (const event of this.streamWithToolEvents(SCOUT_SYSTEM, messages, tools, { maxIterations: 15, cacheTtl: "1h" })) {
      if (event.type === "text") {
        fullText += event.text;
      }
      if (event.type === "tool_call") {
        toolCallNames.set(event.id, event.name);
        yield { type: "tool_call", toolCallId: event.id, toolName: event.name, input: event.input };
      }
      if (event.type === "tool_result") {
        const toolName = toolCallNames.get(event.id) ?? "unknown";
        const resultContent = typeof event.result === "string" ? event.result : JSON.stringify(event.result);
        collectedToolResults.push({ toolName, result: resultContent });

        let summary = "Completed";
        try {
          const parsed = JSON.parse(resultContent);
          if (parsed && typeof parsed === "object" && "count" in parsed) {
            // Wrapped search_companies response: { results, count, message? }
            summary = parsed.count > 0
              ? `${parsed.count} results found`
              : (parsed.message ?? "No results");
          } else if (Array.isArray(parsed)) {
            summary = `${parsed.length} results found`;
          } else if (typeof parsed === "object" && parsed !== null) {
            summary = "Details retrieved";
          }
        } catch { /* use default summary */ }
        yield { type: "tool_result", toolCallId: event.id, toolName, resultSummary: summary };
      }
    }

    const parsed = this.parseResult(fullText);
    if (parsed) {
      yield { type: "result", data: parsed };
    } else {
      // Include tool results in fallback prompt so Claude has grounding data
      const toolContext = collectedToolResults
        .map((tr) => `<tool name="${tr.toolName}">\n${tr.result}\n</tool>`)
        .join("\n");
      const fallback = await this.invokeStructured(
        SCOUT_SYSTEM,
        `Extract the startup search results from the following text and tool results into the required JSON format. Use ONLY company IDs that appear in the tool results below.\n\n<tool_results>\n${toolContext}\n</tool_results>\n\n<agent_text>\n${fullText}\n</agent_text>`,
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
