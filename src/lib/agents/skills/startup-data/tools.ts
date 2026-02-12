import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { searchCompanies, getCompanyDetails } from "./queries";

/**
 * Canonical betaZodTool definitions for the startup-data skill.
 * Shared by all agents that need YC company data access.
 */
export const tools = [
  betaZodTool({
    name: "search_companies",
    description:
      "Search the YC company database with optional filters. Returns up to 50 matching companies. Use multiple searches with different filter combinations for better coverage.",
    inputSchema: z.object({
      query: z
        .string()
        .optional()
        .describe("Text search on name, one-liner, and description"),
      industries: z
        .array(z.string())
        .optional()
        .describe("Filter by industries (e.g. ['B2B', 'Healthcare', 'Fintech'])"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Filter by tags (e.g. ['machine-learning', 'saas', 'api'])"),
      status: z
        .string()
        .optional()
        .describe("Filter by status: Active, Inactive, Acquired, or Public"),
      stage: z
        .string()
        .optional()
        .describe("Filter by stage: Early or Growth"),
      regions: z
        .array(z.string())
        .optional()
        .describe("Filter by regions (e.g. ['United States of America', 'Europe'])"),
      batch: z
        .string()
        .optional()
        .describe("Filter by YC batch (e.g. 'W25', 'S24')"),
      maxTeamSize: z
        .number()
        .optional()
        .describe("Maximum team size"),
      isHiring: z
        .boolean()
        .optional()
        .describe("Filter for companies currently hiring"),
      topCompany: z
        .boolean()
        .optional()
        .describe("Filter for top YC companies"),
    }),
    run: async (input) => JSON.stringify(await searchCompanies(input)),
  }),
  betaZodTool({
    name: "get_company_details",
    description:
      "Get detailed information about a specific YC company by numeric ID, including full description, all tags, regions, and metadata.",
    inputSchema: z.object({
      companyId: z
        .number()
        .describe("The numeric YC company ID"),
    }),
    run: async (input) => {
      const result = await getCompanyDetails(input.companyId);
      return JSON.stringify(result ?? { error: "Company not found" });
    },
  }),
];
