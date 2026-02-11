import type { ZodType } from "zod";
import { toJSONSchema } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic, MODELS } from "@/lib/anthropic";

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
