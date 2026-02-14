import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";

/**
 * Discovery questions tool — renders interactive question forms in the chat.
 *
 * This is a control signal: the tool handler returns a string telling the agent
 * to wait, and the state machine detects the tool_call event to emit a
 * "questions" event that the frontend renders as an interactive form.
 */
export const tools = [
  betaZodTool({
    name: "ask_questions",
    description:
      "Display an interactive question form to the user for gathering structured data (categorical choices, multi-select preferences, quantitative ranges). The form renders in the chat with radio buttons and checkboxes. An 'Other' option is added automatically to every question — do NOT include it in your options. Wait for the user's response before continuing.",
    inputSchema: z.object({
      questions: z
        .array(
          z.object({
            id: z.string().describe("Unique identifier, e.g. 'q1', 'team_size'"),
            question: z.string().describe("The question text"),
            type: z.enum(["single_choice", "multiple_choice"]).describe("single_choice = radio buttons, multiple_choice = checkboxes"),
            options: z.array(z.string()).min(2).max(8).describe("Available options (2-8). Do NOT include 'Other' — it is added automatically"),
            required: z.boolean().default(true).describe("Whether the user must answer this question"),
          })
        )
        .min(1)
        .max(5)
        .describe("1-5 questions to display"),
      context: z
        .string()
        .optional()
        .describe("Brief context explaining why these questions matter"),
    }),
    run: async () => {
      return "Questions displayed to the user. Wait for their response in the next message. Do not continue the conversation or ask more questions until the user responds.";
    },
  }),
];
