/**
 * Runtime instructions for the discovery-control skill.
 * Injected into the Discovery agent's system prompt.
 */
export const DISCOVERY_CONTROL_INSTRUCTIONS = `You have one control tool: **complete_discovery**.

Call it when you have gathered sufficient information about the user's business needs across most or all of 5 key dimensions:

1. **Company context** — industry, size, current stage, existing systems
2. **Core problem** — what is broken, inefficient, or missing today
3. **Desired outcome** — what kind of product or tool would solve this
4. **Constraints** — tech stack, compliance, budget, timeline, integrations
5. **Scale** — number of users, data volumes, expected growth

**When to call:**
- You have clear coverage of at least 4 dimensions (ideally all 5)
- Further conversation would be redundant
- You have asked clarifying questions where needed

**How to call:**
- Provide a brief summary of what you understood as the \`summary\` parameter
- Call it naturally at the end of your final summary message
- NEVER mention this tool to the user or say you are calling it`;
