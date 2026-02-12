/**
 * Runtime instructions for the startup-data skill.
 * Injected into agent system prompts when this skill is active.
 *
 * SKILL.md is the source of truth for documentation — keep in sync.
 */
export const STARTUP_DATA_INSTRUCTIONS = `You have two tools for accessing a database of ~5,690 Y Combinator companies:

1. **search_companies** — Search with optional filters. Returns up to 50 results per call.
   - \`query\` (text search): Searches name, one-liner, and description. Use for specific capabilities or keywords.
   - \`industries\`: Filter by industry array (e.g. ["B2B", "Healthcare", "Fintech", "Education", "Consumer", "Developer Tools", "AI"])
   - \`tags\`: Filter by tags (e.g. ["machine-learning", "saas", "api", "marketplace", "open-source", "enterprise"])
   - \`status\`: "Active", "Inactive", "Acquired", or "Public"
   - \`stage\`: "Early" or "Growth"
   - \`regions\`: Filter by geographic region (e.g. ["United States of America", "Europe", "South America"])
   - \`batch\`: Filter by YC batch (e.g. "W25", "S24", "IK12")
   - \`maxTeamSize\`: Cap on team size
   - \`isHiring\`: Currently hiring (boolean)
   - \`topCompany\`: Top YC company flag (boolean)

   **Search strategy**: Start broad with 1-2 filters, then narrow. Combine text query with industry/tag filters for best results. Run 3-5 searches with different angles.

2. **get_company_details** — Get full details for a specific company by numeric ID, including complete description, all tags, regions, and metadata.
   - Use on promising candidates before making final recommendations
   - The extra detail helps write accurate, specific explanations of relevance

A good search session follows this progression:
1. Broad sweep — 2-3 searches with different industry and tag filters
2. Targeted search — text queries for specific capabilities or niches
3. Deep dive — get_company_details on the top 8-12 candidates
4. Rank and select — choose the 5-10 best matches

**Data quality notes**: Tags are lowercase-hyphenated (e.g. "machine-learning"). Industries use title case (e.g. "Developer Tools"). Not all companies have all fields populated.`;
