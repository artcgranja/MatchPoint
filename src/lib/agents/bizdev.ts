import { BaseAgent } from "./base";
import { BIZDEV_SYSTEM } from "./prompts/bizdev";

export class BizDevAgent extends BaseAgent {
  constructor() {
    super("analysis");
  }

  async *streamPlan(
    conversationTranscript: string
  ): AsyncGenerator<{ type: "thinking" | "text"; text: string }> {
    const userMessage = `<conversation_transcript>
${conversationTranscript}
</conversation_transcript>

Analyze this conversation and produce a complete product document — define what technological solution would solve this problem.`;

    yield* this.streamWithThinking(
      BIZDEV_SYSTEM,
      [{ role: "user", content: userMessage }],
      { effort: "high" }
    );
  }
}
