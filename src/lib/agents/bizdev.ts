import { BaseAgent } from "./base";
import { BIZDEV_SYSTEM } from "./prompts/bizdev";
import type { NeedSummary } from "./schemas";

export class BizDevAgent extends BaseAgent {
  constructor() {
    super("analysis");
  }

  async *streamPlan(
    conversationTranscript: string,
    needSummary?: NeedSummary
  ): AsyncGenerator<{ type: "thinking" | "text"; text: string }> {
    const needSummaryBlock = needSummary
      ? `<need_summary>
Company: ${needSummary.companyContext}
Problem: ${needSummary.coreProblem}
Desired Outcome: ${needSummary.desiredOutcome}
Constraints: ${needSummary.constraints.join("; ")}
Preferences: ${needSummary.preferences.join("; ")}
</need_summary>

`
      : "";

    const userMessage = `${needSummaryBlock}<conversation_transcript>
${conversationTranscript}
</conversation_transcript>

Analyze this conversation and produce a complete product document — define what technological solution would solve this problem.`;

    yield* this.streamWithThinking(
      BIZDEV_SYSTEM,
      [{ role: "user", content: userMessage }],
      { effort: "high", maxTokens: 32768 }
    );
  }
}
