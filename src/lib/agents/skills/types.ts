import type { BetaRunnableTool } from "@anthropic-ai/sdk/lib/tools/BetaRunnableTool";

/**
 * Metadata for a skill — lightweight description for discovery and filtering.
 */
export interface SkillMetadata {
  /** Unique identifier (matches directory name) */
  name: string;
  /** What this skill does and when to use it */
  description: string;
  /** Which agents can use this skill (omit = available to all) */
  agents?: string[];
}

/**
 * A resolved skill with tools and instructions ready for agent consumption.
 */
export interface Skill {
  metadata: SkillMetadata;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: BetaRunnableTool<any>[];
  /** Instructions injected into agent system prompts when this skill is active */
  instructions: string;
}

/**
 * What each skill module exports from its index.ts.
 */
export interface SkillModule {
  metadata: SkillMetadata;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: BetaRunnableTool<any>[];
  instructions: string;
}
