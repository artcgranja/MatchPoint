import { BaseAgent } from "./base";
import { RankedResultSchema, type RankedResult, type BizPlan, type AIAnalysisOutput } from "./schemas";
import { MATCHMAKER_SYSTEM } from "./prompts/matchmaker";

interface AnalyzedCandidate {
  startupId: string;
  startupName: string;
  aiAnalysis: AIAnalysisOutput;
}

export class MatchmakerAgent extends BaseAgent {
  constructor() {
    super("worker");
  }

  async rank(
    candidates: AnalyzedCandidate[],
    bizPlan: BizPlan
  ): Promise<RankedResult> {
    const candidateSummaries = candidates.map((c) => ({
      startupId: c.startupId,
      name: c.startupName,
      matchScore: c.aiAnalysis.matchScore,
      confidence: c.aiAnalysis.confidence,
      strengths: c.aiAnalysis.strengths,
      weaknesses: c.aiAnalysis.weaknesses,
      radarScores: c.aiAnalysis.radarScores,
      synergySummary: c.aiAnalysis.synergySummary,
    }));

    const userMessage = `## BizPlan Evaluation Criteria

Weights:
- Technology Fit: ${bizPlan.evaluation.weightTechnologyFit}
- Market Alignment: ${bizPlan.evaluation.weightMarketAlignment}
- Team Strength: ${bizPlan.evaluation.weightTeamStrength}
- Financial Health: ${bizPlan.evaluation.weightFinancialHealth}
- Innovation: ${bizPlan.evaluation.weightInnovation}
- Scalability: ${bizPlan.evaluation.weightScalability}

Deal-Breakers: ${bizPlan.evaluation.dealBreakers.join(", ") || "None specified"}
Nice-to-Haves: ${bizPlan.evaluation.niceToHaves.join(", ") || "None specified"}

## Analyzed Candidates (${candidates.length})

${JSON.stringify(candidateSummaries, null, 2)}

Produce a final ranking of all candidates from best to worst match. Apply the evaluation weights and consider deal-breakers and nice-to-haves.`;

    return this.invokeStructured(
      MATCHMAKER_SYSTEM,
      userMessage,
      RankedResultSchema
    );
  }
}
