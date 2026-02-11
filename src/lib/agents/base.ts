import type { ZodType } from "zod";
import { toJSONSchema } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { anthropic, MODELS } from "@/lib/anthropic";

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Anthropic.Messages.Tool.InputSchema;
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

export abstract class BaseAgent {
  protected client = anthropic;
  protected model: string;

  constructor(model: keyof typeof MODELS) {
    this.model = MODELS[model];
  }

  async invoke(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: [
        { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock?.type === "text" ? textBlock.text : "";
  }

  async invokeStructured<T>(
    systemPrompt: string,
    userMessage: string,
    schema: ZodType<T>
  ): Promise<T> {
    const jsonSchema = toJSONSchema(schema);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: [
        { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userMessage }],
      tools: [
        {
          name: "structured_output",
          description: "Return the structured result",
          input_schema: jsonSchema as Anthropic.Messages.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: "structured_output" },
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      throw new Error("No tool_use block in response");
    }
    return schema.parse(toolBlock.input);
  }

  async *stream(
    systemPrompt: string,
    messages: Array<{ role: "user" | "assistant"; content: string }>
  ): AsyncGenerator<string> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 4096,
      system: [
        { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
      ],
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }

  async invokeWithTools(
    systemPrompt: string,
    messages: MessageParam[],
    tools: ToolDefinition[],
    options?: { maxTurns?: number }
  ): Promise<{ text: string; toolResults: unknown[] }> {
    const maxTurns = options?.maxTurns ?? 10;
    const anthropicTools: Anthropic.Messages.Tool[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    }));

    const allToolResults: unknown[] = [];
    const conversationMessages: MessageParam[] = [...messages];

    for (let turn = 0; turn < maxTurns; turn++) {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 8192,
        system: [
          { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
        ],
        messages: conversationMessages,
        tools: anthropicTools,
      });

      if (response.stop_reason === "end_turn") {
        const textBlock = response.content.find((b) => b.type === "text");
        return {
          text: textBlock?.type === "text" ? textBlock.text : "",
          toolResults: allToolResults,
        };
      }

      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
        );

        // Execute all tool calls in parallel
        const results = await Promise.all(
          toolUseBlocks.map(async (block) => {
            const toolDef = tools.find((t) => t.name === block.name);
            if (!toolDef) {
              return { id: block.id, result: null, error: `Unknown tool: ${block.name}` };
            }
            try {
              const result = await toolDef.handler(block.input as Record<string, unknown>);
              allToolResults.push(result);
              return { id: block.id, result, error: null };
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : "Tool execution failed";
              return { id: block.id, result: null, error: errorMsg };
            }
          })
        );

        // Append assistant message + tool results
        conversationMessages.push({ role: "assistant", content: response.content });
        conversationMessages.push({
          role: "user",
          content: results.map((r) => ({
            type: "tool_result" as const,
            tool_use_id: r.id,
            content: r.error
              ? JSON.stringify({ error: r.error })
              : JSON.stringify(r.result),
          })),
        });

        continue;
      }

      // Any other stop_reason: extract text and return
      const textBlock = response.content.find((b) => b.type === "text");
      return {
        text: textBlock?.type === "text" ? textBlock.text : "",
        toolResults: allToolResults,
      };
    }

    // Max turns reached — extract whatever text we have from last turn
    return { text: "", toolResults: allToolResults };
  }

  async *streamWithThinking(
    systemPrompt: string,
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    options?: { effort?: "high" | "medium" | "low" }
  ): AsyncGenerator<{ type: "thinking" | "text"; text: string }> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 16384,
      thinking: { type: "adaptive" },
      output_config: { effort: options?.effort ?? "high" },
      system: [
        { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
      ],
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta") {
        if (event.delta.type === "thinking_delta") {
          yield { type: "thinking", text: event.delta.thinking };
        } else if (event.delta.type === "text_delta") {
          yield { type: "text", text: event.delta.text };
        }
      }
    }
  }
}
