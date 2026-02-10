import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic();

export const MODELS = {
  navigator: "claude-opus-4-6",
  worker: "claude-haiku-4-5-20251001",
} as const;
