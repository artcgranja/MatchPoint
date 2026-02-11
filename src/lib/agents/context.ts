import { prisma } from "@/lib/db";
import type { NeedSummary } from "./schemas";

export interface SessionContext {
  needSummary: NeedSummary | null;
  productDocument: string | null;
  scoutSummary: string | null;
  searchResults: Array<{
    rank: number;
    startupName: string;
    whyRelevant: string;
  }>;
  postPipelineMessages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export async function assembleSessionContext(
  searchId: string
): Promise<SessionContext> {
  const search = await prisma.searchExecution.findUniqueOrThrow({
    where: { id: searchId },
    include: {
      discoverySession: true,
      results: {
        orderBy: { rank: "asc" },
        include: { startup: { select: { name: true } } },
      },
      orchestratorMessages: {
        orderBy: { createdAt: "asc" },
        take: 20,
      },
    },
  });

  // Tier 1: NeedSummary from discovery session
  const needSummary = search.discoverySession?.bizPlan
    ? (search.discoverySession.bizPlan as unknown as NeedSummary)
    : null;

  // Tier 2: Product Document from bizPlan
  const bizPlan = search.bizPlan as unknown as {
    productDocument?: string;
  } | null;
  const productDocument = bizPlan?.productDocument ?? null;

  // Tier 3: Search Results
  const searchResults = search.results.map((r) => {
    const analysis = r.aiAnalysis as unknown as {
      whyRelevant?: string;
    } | null;
    return {
      rank: r.rank,
      startupName: r.startup.name,
      whyRelevant: analysis?.whyRelevant ?? "",
    };
  });

  // Tier 5: Post-pipeline messages
  const postPipelineMessages = search.orchestratorMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return {
    needSummary,
    productDocument,
    scoutSummary: search.scoutSummary,
    searchResults,
    postPipelineMessages,
  };
}

export function buildContextBlock(context: SessionContext): string {
  const sections: string[] = [];

  if (context.needSummary) {
    const ns = context.needSummary;
    sections.push(`<need_summary>
Company: ${ns.companyContext}
Problem: ${ns.coreProblem}
Desired Outcome: ${ns.desiredOutcome}
Constraints: ${ns.constraints.join("; ")}
Preferences: ${ns.preferences.join("; ")}
</need_summary>`);
  }

  if (context.productDocument) {
    sections.push(`<product_document>
${context.productDocument}
</product_document>`);
  }

  if (context.searchResults.length > 0) {
    const resultsText = context.searchResults
      .map((r) => `${r.rank}. ${r.startupName} — ${r.whyRelevant}`)
      .join("\n");
    sections.push(`<search_results>
${context.scoutSummary ? `Summary: ${context.scoutSummary}\n\n` : ""}${resultsText}
</search_results>`);
  }

  return sections.join("\n\n");
}
