import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic();

export const MODELS = {
  discovery: "claude-haiku-4-5-20251001",
  analysis: "claude-opus-4-6",
  scout: "claude-haiku-4-5-20251001",
} as const;
