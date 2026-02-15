import type { SkillModule } from "../types";
import { tools } from "./tools";
import { DISCOVERY_QUESTIONS_INSTRUCTIONS } from "./instructions";

export const discoveryQuestionsSkill: SkillModule = {
  metadata: {
    name: "discovery-questions",
    description:
      "Interactive question forms for the Discovery agent — renders radio buttons and checkboxes in the chat to collect structured data efficiently",
    agents: ["discovery"],
  },
  tools,
  instructions: DISCOVERY_QUESTIONS_INSTRUCTIONS,
};

export { tools } from "./tools";
