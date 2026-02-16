import type { SkillModule } from "../types";
import { BUILDER_SANDBOX_INSTRUCTIONS } from "./instructions";

/**
 * Builder sandbox skill — provides file and command tools for the builder agent.
 *
 * NOTE: Unlike other skills, builder tools are dynamically created per-request
 * with a sandbox instance bound via closure. The `tools` array here is empty
 * because tools are composed dynamically in the orchestrator.
 * The skill module is registered primarily for its instructions.
 */
export const builderSandboxSkill: SkillModule = {
  metadata: {
    name: "builder-sandbox",
    description:
      "File operations and command execution tools for the builder sandbox environment",
    agents: ["builder"],
  },
  tools: [], // Dynamic — created per-request with sandbox binding
  instructions: BUILDER_SANDBOX_INSTRUCTIONS,
};

export { createBuilderTools } from "./tools";
