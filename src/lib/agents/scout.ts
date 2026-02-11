import { BaseAgent } from "./base";
import { ScoutResultSchema, type ScoutResult, type SearchCriteria, type NeedSummary } from "./schemas";
import { SCOUT_SYSTEM } from "./prompts/scout";
import { prisma } from "@/lib/db";

export class ScoutAgent extends BaseAgent {
  constructor() {
    super("scout");
  }

  async search(criteria: SearchCriteria, needSummary: NeedSummary): Promise<ScoutResult> {
    const startups = await prisma.startup.findMany({
      include: { metrics: true },
    });

    const startupSummaries = startups.map((s) => ({
      id: s.id,
      name: s.name,
      tagline: s.tagline,
      description: s.description,
      industries: s.industries,
      technologies: s.technologies,
      fundingStage: s.fundingStage,
      employees: s.employees,
      location: s.location,
      totalFunding: s.totalFunding,
      revenue: s.metrics?.revenue ?? 0,
      revenueGrowth: s.metrics?.revenueGrowth ?? 0,
      customers: s.metrics?.customers ?? 0,
    }));

    const userMessage = `## SearchCriteria

${JSON.stringify(criteria, null, 2)}

## NeedSummary

${JSON.stringify(needSummary, null, 2)}

## Available Startups (${startups.length} total)

${JSON.stringify(startupSummaries, null, 2)}

Based on the SearchCriteria and NeedSummary, select the most relevant startups and return them as cards with whyRelevant explanations.`;

    return this.invokeStructured(SCOUT_SYSTEM, userMessage, ScoutResultSchema);
  }
}
