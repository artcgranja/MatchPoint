import { BaseAgent } from "./base";
import { ReportSectionsSchema, type ReportSections } from "./schemas";
import { REPORTER_SYSTEM } from "./prompts/reporter";
import { prisma } from "@/lib/db";

export class ReporterAgent extends BaseAgent {
  constructor() {
    super("worker");
  }

  async generateReport(
    ranked: Array<{
      startup: { name: string; tagline: string; description: string; fundingStage: string };
      aiAnalysis: Record<string, unknown>;
      matchScore: number;
      rank: number;
    }>,
    bizPlan: unknown,
    searchId: string
  ) {
    const summaries = ranked.map((r) => ({
      rank: r.rank,
      name: r.startup.name,
      tagline: r.startup.tagline,
      fundingStage: r.startup.fundingStage,
      matchScore: r.matchScore,
      analysis: r.aiAnalysis,
    }));

    const userMessage = `## BizPlan

${JSON.stringify(bizPlan, null, 2)}

## Ranked Results (${ranked.length} startups)

${JSON.stringify(summaries, null, 2)}

Generate a comprehensive executive briefing report with sections covering: Executive Summary, Search Criteria Overview, Top Matches Analysis, Comparative Analysis (with radar chartType), Risk Assessment (with bar chartType), and Recommendations & Next Steps.`;

    const result: ReportSections = await this.invokeStructured(
      REPORTER_SYSTEM,
      userMessage,
      ReportSectionsSchema
    );

    // Save report to database
    const report = await prisma.report.create({
      data: {
        title: result.title,
        searchQueryId: searchId,
        sections: JSON.parse(JSON.stringify(result.sections)),
      },
    });

    return {
      id: report.id,
      title: report.title,
      searchQueryId: searchId,
      sections: result.sections,
      createdAt: report.createdAt.toISOString(),
    };
  }
}
