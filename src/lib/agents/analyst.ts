import { BaseAgent } from "./base";
import { SearchCriteriaSchema, type SearchCriteria, type NeedSummary } from "./schemas";
import { ANALYSIS_SYSTEM } from "./prompts/analyst";

export class AnalysisAgent extends BaseAgent {
  constructor() {
    super("analysis");
  }

  async analyze(needSummary: NeedSummary): Promise<SearchCriteria> {
    const userMessage = `## NeedSummary

${JSON.stringify(needSummary, null, 2)}

Analyze this business need and produce structured SearchCriteria to find matching startups.`;

    return this.invokeStructured(ANALYSIS_SYSTEM, userMessage, SearchCriteriaSchema);
  }
}
