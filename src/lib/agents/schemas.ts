import { z } from "zod";

export const BizPlanSchema = z.object({
  situation: z.object({
    companyContext: z.string(),
    industry: z.string(),
    companySize: z.string(),
    currentTechStack: z.array(z.string()),
    geographicScope: z.string(),
  }),
  challenge: z.object({
    primaryPainPoint: z.string(),
    secondaryPainPoints: z.array(z.string()),
    impactDescription: z.string(),
    urgencyLevel: z.enum(["low", "medium", "high", "critical"]),
    failedAttempts: z.array(z.string()),
  }),
  objectives: z.object({
    primaryObjective: z.string(),
    successMetrics: z.array(z.string()),
    timeline: z.string(),
    budgetRange: z.string(),
  }),
  parameters: z.object({
    requiredIndustries: z.array(z.string()),
    requiredTechnologies: z.array(z.string()),
    preferredFundingStages: z.array(z.string()),
    maxCompanySize: z.number(),
    geographicPreferences: z.array(z.string()),
    integrationRequirements: z.array(z.string()),
    complianceRequirements: z.array(z.string()),
  }),
  evaluation: z.object({
    weightTechnologyFit: z.number().min(0).max(1),
    weightMarketAlignment: z.number().min(0).max(1),
    weightTeamStrength: z.number().min(0).max(1),
    weightFinancialHealth: z.number().min(0).max(1),
    weightInnovation: z.number().min(0).max(1),
    weightScalability: z.number().min(0).max(1),
    dealBreakers: z.array(z.string()),
    niceToHaves: z.array(z.string()),
  }),
  executiveSummary: z.string(),
});

export type BizPlan = z.infer<typeof BizPlanSchema>;

export const AIAnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  risks: z.array(z.string()),
  synergySummary: z.string(),
  radarScores: z.array(
    z.object({
      dimension: z.string(),
      score: z.number().min(0).max(100),
      benchmark: z.number().min(0).max(100),
    })
  ),
});

export type AIAnalysisOutput = z.infer<typeof AIAnalysisSchema>;

export const ScoutResultSchema = z.object({
  shortlistedStartupIds: z.array(z.string()),
  reasoning: z.string(),
});

export type ScoutResult = z.infer<typeof ScoutResultSchema>;

export const RankedResultSchema = z.object({
  rankings: z.array(
    z.object({
      startupId: z.string(),
      finalScore: z.number().min(0).max(100),
      confidence: z.number().min(0).max(100),
      reasoning: z.string(),
    })
  ),
});

export type RankedResult = z.infer<typeof RankedResultSchema>;

export const ReportSectionsSchema = z.object({
  title: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      chartType: z.enum(["radar", "bar", "line"]).optional(),
    })
  ),
});

export type ReportSections = z.infer<typeof ReportSectionsSchema>;
