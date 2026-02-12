import type { SkillModule } from "../types";
import { tools } from "./tools";
import { STARTUP_DATA_INSTRUCTIONS } from "./instructions";

export const startupDataSkill: SkillModule = {
  metadata: {
    name: "startup-data",
    description:
      "Search and retrieve YC startup company data — use when agents need to find companies by filters or get detailed company information",
    agents: ["scout", "advisor"],
  },
  tools,
  instructions: STARTUP_DATA_INSTRUCTIONS,
};

export { tools } from "./tools";
