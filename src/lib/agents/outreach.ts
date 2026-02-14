import { BaseAgent } from "./base";
import { OutreachEmailSchema, type OutreachEmail } from "./schemas";
import { OUTREACH_SYSTEM } from "./prompts/outreach";

interface OutreachContext {
  needSummary: Record<string, unknown>;
  bizPlan?: string | null;
  startupName: string;
  startupOneLiner: string;
  whyRelevant: string;
  seekerCompany?: string;
}

class OutreachAgent extends BaseAgent {
  constructor() {
    super("analysis"); // Opus — complex writing task
  }

  async generateEmail(context: OutreachContext): Promise<OutreachEmail> {
    const userMessage = `Generate an outreach email for the following connection:

<seeker_needs>
${JSON.stringify(context.needSummary, null, 2)}
</seeker_needs>

${context.bizPlan ? `<product_document>\n${context.bizPlan}\n</product_document>` : ""}

<startup>
Name: ${context.startupName}
Description: ${context.startupOneLiner}
Why Matched: ${context.whyRelevant}
</startup>

${context.seekerCompany ? `<seeker_company>${context.seekerCompany}</seeker_company>` : ""}

Generate the outreach email now.`;

    return this.invokeStructured(OUTREACH_SYSTEM, userMessage, OutreachEmailSchema);
  }
}

export const outreachAgent = new OutreachAgent();
