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
          company: true,
        },
      },
      stageLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!search) {
    return NextResponse.json({ error: "Search not found" }, { status: 404 });
  }

  const cards = search.results.map((r) => ({
    id: r.company.id,
    name: r.company.name,
    oneLiner: r.company.oneLiner,
    whyRelevant: (r.aiAnalysis as Record<string, unknown>)?.whyRelevant ?? "",
    industries: r.company.industries,
    tags: r.company.tags,
    batch: r.company.batch,
    location: r.company.allLocations,
    website: r.company.website,
    ycUrl: r.company.ycUrl,
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
