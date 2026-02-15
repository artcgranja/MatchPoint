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

export const StartupCardSchema = z.object({
  id: z.number().describe("The company's YC ID"),
  name: z.string().describe("Company name"),
  oneLiner: z.string().describe("One-line description"),
  whyRelevant: z
    .string()
    .describe("2-3 sentence explanation of why this company is relevant to the user's needs"),
  industries: z.array(z.string()).describe("Industries the company operates in"),
  tags: z.array(z.string()).describe("Tags/categories"),
  batch: z.string().describe("YC batch (e.g., W25, S24)"),
  location: z.string().describe("Headquarters location"),
  website: z.string().describe("Company website URL"),
  ycUrl: z.string().describe("Y Combinator profile URL"),
});

export type StartupCard = z.infer<typeof StartupCardSchema>;

export const ScoutResultSchema = z.object({
  cards: z
    .array(StartupCardSchema)
    .describe("Company cards with relevance explanations, ordered by relevance"),
  summary: z
    .string()
    .describe("Brief summary of the search results and key patterns found"),
});

export type ScoutResult = z.infer<typeof ScoutResultSchema>;

export const OutreachEmailSchema = z.object({
  subject: z
    .string()
    .describe("Email subject line, under 60 chars, direct and compelling"),
  body: z
    .string()
    .describe("Email body in plain text, under 250 words, professional and concise"),
  seekerProblemSummary: z
    .string()
    .describe("One-sentence summary of the seeker's problem for internal tracking"),
});

export type OutreachEmail = z.infer<typeof OutreachEmailSchema>;

// ═══════════════════════════════════════════
// Product Concept Extraction
// ═══════════════════════════════════════════

export const ProductConceptSchema = z.object({
  name: z
    .string()
    .describe(
      "Canonical product concept name, 2-5 words, Title Case, technology-first (e.g., 'AI Contract Analysis', 'Fleet Route Optimization')"
    ),
  definition: z
    .string()
    .describe(
      "One-sentence generic definition of this product category, independent of any specific company"
    ),
  category: z
    .string()
    .describe(
      "High-level domain: AI/ML, Logistics, Fintech, Healthcare, HR, Marketing, Operations, Security, Analytics, Communication, or Other"
    ),
});

export type ProductConcept = z.infer<typeof ProductConceptSchema>;

export const ConceptClassificationSchema = z.object({
  matchedConceptName: z
    .string()
    .nullable()
    .describe(
      "The exact name of the existing concept that matches, or null if this is a genuinely new concept"
    ),
  confidence: z
    .number()
    .describe(
      "Confidence that this is a match (0.0-1.0). Only meaningful when matchedConceptName is not null"
    ),
  reasoning: z
    .string()
    .describe("Brief explanation of why this matches or why it is new"),
});

export type ConceptClassification = z.infer<typeof ConceptClassificationSchema>;
