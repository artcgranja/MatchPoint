---
name: startup-data
description: "Search and retrieve YC startup company data — use when agents need to find companies by filters or get detailed company information"
agents:
  - scout
  - advisor
---

# Startup Data Skill

Access to a database of ~5,690 Y Combinator companies. Provides search and detail retrieval tools.

## Tools

### search_companies

Search the YC company database with optional filters. Returns up to 50 matching companies per call.

**Filters available:**
- `query` (text search): Searches name, one-liner, and description. Use for specific capabilities or keywords.
- `industries`: Filter by industry array (e.g. ["B2B", "Healthcare", "Fintech", "Education", "Consumer", "Developer Tools", "AI"])
- `tags`: Filter by tags (e.g. ["machine-learning", "saas", "api", "marketplace", "open-source", "enterprise"])
- `status`: "Active", "Inactive", "Acquired", or "Public"
- `stage`: "Early" or "Growth"
- `regions`: Filter by geographic region (e.g. ["United States of America", "Europe", "South America"])
- `batch`: Filter by YC batch (e.g. "W25", "S24", "IK12")
- `maxTeamSize`: Cap on team size
- `isHiring`: Currently hiring (boolean)
- `topCompany`: Top YC company flag (boolean)

**Search strategy**: Start broad with 1-2 filters, then narrow. Combine text query with industry/tag filters for best results. Run 3-5 searches with different angles.

### get_company_details

Get full details for a specific company by numeric ID, including complete description, all tags, regions, and metadata.

- Use on promising candidates before making final recommendations
- The extra detail helps write accurate, specific explanations of relevance

## Search Session Pattern

A good search session follows this progression:

1. **Broad sweep** — 2-3 searches with different industry and tag filters
2. **Targeted search** — text queries for specific capabilities or niches
3. **Deep dive** — get_company_details on the top 8-12 candidates
4. **Rank and select** — choose the 5-10 best matches

## Data Quality Notes

- Tags are lowercase-hyphenated (e.g. "machine-learning", not "Machine Learning")
- Industries use title case (e.g. "Developer Tools", not "developer-tools")
- `allLocations` is a comma-separated string, not an array
- Not all companies have all fields populated — handle missing data gracefully
