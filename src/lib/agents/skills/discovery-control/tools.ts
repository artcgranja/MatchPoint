import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";

/**
 * Discovery control tool — signals that the discovery conversation is complete.
 *
 * This is a pure control signal: the tool handler returns a success string,
 * and the state machine detects the tool_call event to trigger side effects
 * (NeedSummary extraction, DB update, analysis transition).
 */
export const tools = [
  betaZodTool({
    name: "complete_discovery",
    description:
      "Signal that the discovery conversation is complete. Call this when you have gathered sufficient information about the user's business needs across most or all of the 5 key dimensions. This will automatically transition to the analysis stage.",
    inputSchema: z.object({
      summary: z
        .string()
        .describe(
          "2-3 sentence summary of the user's situation as you understand it — company context, core problem, and desired outcome"
        ),
    }),
    run: async () => {
      return "Discovery marked as complete. The system will now extract a structured summary and begin analysis.";
    },
  }),
];
