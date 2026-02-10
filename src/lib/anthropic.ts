import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic();

export const MODELS = {
  navigator: "claude-opus-4-5-20250929",
  worker: "claude-haiku-4-5-20250929",
} as const;
