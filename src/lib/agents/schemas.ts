import { z } from "zod";

export const NeedSummarySchema = z.object({
  companyContext: z
    .string()
    .describe("Brief description of the company, industry, size, and current state"),
  coreProblem: z
    .string()
    .describe("The main business challenge or pain point the company faces"),
  desiredOutcome: z
    .string()
    .describe("What the ideal solution or result looks like for the company"),
  constraints: z
    .array(z.string())
    .describe("Hard constraints: budget limits, compliance needs, tech requirements, geographic restrictions"),
  preferences: z
    .array(z.string())
    .describe("Soft preferences: nice-to-haves, preferred technologies, funding stage, team size"),
});

export type NeedSummary = z.infer<typeof NeedSummarySchema>;

export const SearchCriteriaSchema = z.object({
  industries: z
    .array(z.string())
    .describe("Target industries to search for startups"),
  technologies: z
    .array(z.string())
    .describe("Required or preferred technologies"),
  fundingStages: z
    .array(z.string())
    .describe("Acceptable funding stages (e.g. Seed, Series A, Series B)"),
  keywords: z
    .array(z.string())
    .describe("Search keywords derived from the problem analysis"),
  analysisNarrative: z
    .string()
    .describe("A narrative explanation of why these criteria were chosen and what to prioritize in the search"),
});

export type SearchCriteria = z.infer<typeof SearchCriteriaSchema>;

export const StartupCardSchema = z.object({
  id: z.string().describe("The startup's database ID"),
  name: z.string().describe("Startup name"),
  tagline: z.string().describe("One-line description"),
  description: z.string().describe("Brief description of what the startup does"),
  whyRelevant: z
    .string()
    .describe("2-3 sentence explanation of why this startup is relevant to the user's needs"),
  industries: z.array(z.string()).describe("Industries the startup operates in"),
  fundingStage: z.string().describe("Current funding stage"),
  location: z.string().describe("Headquarters location"),
});

export type StartupCard = z.infer<typeof StartupCardSchema>;

export const ScoutResultSchema = z.object({
  cards: z
    .array(StartupCardSchema)
    .describe("Startup cards with relevance explanations, ordered by relevance"),
  summary: z
    .string()
    .describe("Brief summary of the search results and key patterns found"),
});

export type ScoutResult = z.infer<typeof ScoutResultSchema>;

