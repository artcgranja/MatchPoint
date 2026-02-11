import type { ZodType } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import type { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta";
import type { BetaRunnableTool } from "@anthropic-ai/sdk/lib/tools/BetaRunnableTool";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, MODELS } from "@/lib/anthropic";

export type ToolStreamEvent =
  | { type: "text"; text: string }
  | { type: "tool_call"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; id: string; name: string; result: unknown; error?: string };

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
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: [
        { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userMessage }],
      output_config: { format: zodOutputFormat(schema) },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text block in structured response");
    }
    return schema.parse(JSON.parse(textBlock.text));
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

  async runWithTools(
    systemPrompt: string,
    messages: BetaMessageParam[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: BetaRunnableTool<any>[],
    options?: { maxIterations?: number }
  ): Promise<{ text: string }> {
    const runner = this.client.beta.messages.toolRunner({
      model: this.model,
      max_tokens: 8192,
      system: [
        { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
      ],
      messages,
      tools,
      max_iterations: options?.maxIterations ?? 15,
    });

    const finalMessage = await runner.runUntilDone();
    const textBlock = finalMessage.content.find((b) => b.type === "text");
    return { text: textBlock?.type === "text" ? textBlock.text : "" };
  }

  async *streamWithToolEvents(
    systemPrompt: string,
    messages: BetaMessageParam[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: BetaRunnableTool<any>[],
    options?: { maxIterations?: number }
  ): AsyncGenerator<ToolStreamEvent> {
    const runner = this.client.beta.messages.toolRunner({
      model: this.model,
      max_tokens: 8192,
      system: [
        { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
      ],
      messages,
      tools,
      stream: true,
      max_iterations: options?.maxIterations ?? 15,
    });

    // Track tool_use blocks by index as they stream in
    const toolUseBlocks = new Map<number, { id: string; name: string; partialJson: string }>();

    for await (const stream of runner) {
      for await (const event of stream) {
        if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
          toolUseBlocks.set(event.index, {
            id: event.content_block.id,
            name: event.content_block.name,
            partialJson: "",
          });
        }

        if (event.type === "content_block_delta") {
          if (event.delta.type === "text_delta") {
            yield { type: "text", text: event.delta.text };
          }
          if (event.delta.type === "input_json_delta") {
            const block = toolUseBlocks.get(event.index);
            if (block) block.partialJson += event.delta.partial_json;
          }
        }

        if (event.type === "content_block_stop") {
          const block = toolUseBlocks.get(event.index);
          if (block) {
            let input: Record<string, unknown> = {};
            try { input = JSON.parse(block.partialJson); } catch { /* empty input */ }
            yield { type: "tool_call", id: block.id, name: block.name, input };
            toolUseBlocks.delete(event.index);
          }
        }
      }

      // After the stream finishes, the runner auto-executes tools.
      // Yield tool_result events from the appended messages.
      const lastMsg = runner.params.messages.at(-1);
      if (lastMsg && lastMsg.role === "user" && Array.isArray(lastMsg.content)) {
        for (const block of lastMsg.content) {
          if (typeof block === "object" && "type" in block && block.type === "tool_result") {
            yield {
              type: "tool_result",
              id: block.tool_use_id,
              name: "",
              result: block.content,
            };
          }
        }
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
