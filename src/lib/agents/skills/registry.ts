import type { BetaRunnableTool } from "@anthropic-ai/sdk/lib/tools/BetaRunnableTool";
import type { Skill, SkillModule } from "./types";
import { startupDataSkill } from "./startup-data";
import { discoveryControlSkill } from "./discovery-control";
import { discoveryQuestionsSkill } from "./discovery-questions";
import { builderSandboxSkill } from "./builder-sandbox";

/** All registered skills. Add new skills here. */
const SKILL_MODULES: SkillModule[] = [startupDataSkill, discoveryControlSkill, discoveryQuestionsSkill, builderSandboxSkill];

function resolve(mod: SkillModule): Skill {
  return {
    metadata: mod.metadata,
    tools: mod.tools,
    instructions: mod.instructions,
  };
}

/** Get all skills available to a specific agent. */
export function getSkillsForAgent(agentName: string): Skill[] {
  return SKILL_MODULES.filter(
    (mod) => !mod.metadata.agents?.length || mod.metadata.agents.includes(agentName)
  ).map(resolve);
}

/** Get a specific skill by name. */
export function getSkill(skillName: string): Skill | undefined {
  const mod = SKILL_MODULES.find((m) => m.metadata.name === skillName);
  return mod ? resolve(mod) : undefined;
}

/** Compose tools from all skills available to an agent. */
export function composeToolsForAgent(
  agentName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): BetaRunnableTool<any>[] {
  return getSkillsForAgent(agentName).flatMap((s) => s.tools);
}

/** Compose instructions from all skills available to an agent. */
export function composeInstructionsForAgent(agentName: string): string {
  const skills = getSkillsForAgent(agentName);
  if (skills.length === 0) return "";
  if (skills.length === 1) return skills[0].instructions;
  return skills
    .map((s) => `## Skill: ${s.metadata.name}\n\n${s.instructions}`)
    .join("\n\n---\n\n");
}
