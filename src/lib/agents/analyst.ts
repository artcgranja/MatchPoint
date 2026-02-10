import { BaseAgent } from "./base";
import { AIAnalysisSchema, type AIAnalysisOutput, type BizPlan } from "./schemas";
import { ANALYST_SYSTEM } from "./prompts/analyst";

interface StartupData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  industries: string[];
  technologies: string[];
  fundingStage: string;
  employees: number;
  location: string;
  totalFunding: number;
  teamMembers: { name: string; role: string }[];
  metrics: {
    revenue: number;
    revenueGrowth: number;
    customers: number;
    nps: number;
    burnRate: number;
    runway: number;
  } | null;
}

export class AnalystAgent extends BaseAgent {
  constructor() {
    super("worker");
  }

  async analyze(startup: StartupData, bizPlan: BizPlan): Promise<AIAnalysisOutput> {
    const startupProfile = {
      name: startup.name,
      tagline: startup.tagline,
      description: startup.description,
      industries: startup.industries,
      technologies: startup.technologies,
      fundingStage: startup.fundingStage,
      employees: startup.employees,
      location: startup.location,
      totalFunding: startup.totalFunding,
      team: startup.teamMembers.map((t) => ({ name: t.name, role: t.role })),
      metrics: startup.metrics,
    };

    const userMessage = `## BizPlan

${JSON.stringify(bizPlan, null, 2)}

## Startup Profile: ${startup.name}

${JSON.stringify(startupProfile, null, 2)}

Produce a comprehensive AIAnalysis for this startup against the BizPlan. Include matchScore, confidence, SWOT (strengths, weaknesses, opportunities, risks), synergySummary, and radarScores for all 6 dimensions.`;

    return this.invokeStructured(ANALYST_SYSTEM, userMessage, AIAnalysisSchema);
  }
}
