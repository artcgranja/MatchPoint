import { BaseAgent } from "./base";
import { ScoutResultSchema, type ScoutResult, type BizPlan } from "./schemas";
import { SCOUT_SYSTEM } from "./prompts/scout";
import { prisma } from "@/lib/db";

export class ScoutAgent extends BaseAgent {
  constructor() {
    super("worker");
  }

  async search(bizPlan: BizPlan): Promise<string[]> {
    // Fetch all startups from DB (with <1000 startups, we send summaries to the agent)
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

    const userMessage = `## BizPlan

${JSON.stringify(bizPlan, null, 2)}

## Available Startups (${startups.length} total)

${JSON.stringify(startupSummaries, null, 2)}

Based on the BizPlan, select the top 8-15 most promising startups for deeper analysis. Return their IDs.`;

    const result: ScoutResult = await this.invokeStructured(
      SCOUT_SYSTEM,
      userMessage,
      ScoutResultSchema
    );

    return result.shortlistedStartupIds;
  }
}
