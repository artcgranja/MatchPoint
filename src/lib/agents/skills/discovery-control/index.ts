import type { SkillModule } from "../types";
import { tools } from "./tools";
import { DISCOVERY_CONTROL_INSTRUCTIONS } from "./instructions";

export const discoveryControlSkill: SkillModule = {
  metadata: {
    name: "discovery-control",
    description:
      "Control signal for discovery completion — allows the Discovery agent to explicitly mark when the conversation is complete",
    agents: ["discovery"],
  },
  tools,
  instructions: DISCOVERY_CONTROL_INSTRUCTIONS,
};

export { tools } from "./tools";
