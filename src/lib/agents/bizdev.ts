import { BaseAgent } from "./base";
import { BizDevPlanSchema, type BizDevPlan, type NeedSummary } from "./schemas";
import { BIZDEV_SYSTEM, BIZDEV_EXTRACT_SYSTEM } from "./prompts/bizdev";
import { MODELS } from "@/lib/anthropic";

export class BizDevAgent extends BaseAgent {
  constructor() {
    super("analysis");
  }

  async *streamPlan(
    needSummary: NeedSummary
  ): AsyncGenerator<{ type: "thinking" | "text"; text: string }> {
    const userMessage = `## NeedSummary

${JSON.stringify(needSummary, null, 2)}

Analise esta necessidade de negocio e produza um plano BizDev abrangente.`;

    yield* this.streamWithThinking(
      BIZDEV_SYSTEM,
      [{ role: "user", content: userMessage }],
      { effort: "high" }
    );
  }

  async extractStructured(
    fullPlanText: string,
    needSummary: NeedSummary
  ): Promise<BizDevPlan> {
    const userMessage = `## NeedSummary Original

${JSON.stringify(needSummary, null, 2)}

## Texto do Plano BizDev

${fullPlanText}

Extraia as informacoes estruturadas deste plano BizDev.`;

    // Use Haiku for fast structured extraction
    const savedModel = this.model;
    this.model = MODELS.scout;
    try {
      return await this.invokeStructured(
        BIZDEV_EXTRACT_SYSTEM,
        userMessage,
        BizDevPlanSchema
      );
    } finally {
      this.model = savedModel;
    }
  }
}
