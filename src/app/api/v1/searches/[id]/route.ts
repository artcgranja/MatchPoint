import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const search = await prisma.searchExecution.findUnique({
    where: { id },
    include: {
      results: {
        orderBy: { rank: "asc" },
        include: {
          startup: true,
        },
      },
      stageLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!search) {
    return NextResponse.json({ error: "Search not found" }, { status: 404 });
  }

  const cards = search.results.map((r) => ({
    id: r.startup.id,
    name: r.startup.name,
    tagline: r.startup.tagline,
    description: r.startup.description,
    whyRelevant: (r.aiAnalysis as Record<string, unknown>)?.whyRelevant ?? "",
    industries: r.startup.industries,
    fundingStage: r.startup.fundingStage,
    location: r.startup.location,
  }));

  return NextResponse.json({
    id: search.id,
    status: search.status,
    resultCount: search.resultCount,
    timestamp: search.createdAt.toISOString(),
    cards,
    stageLogs: search.stageLogs,
  });
}
