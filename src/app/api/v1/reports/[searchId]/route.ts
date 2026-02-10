import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ReporterAgent } from "@/lib/agents/reporter";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ searchId: string }> }
) {
  const { searchId } = await params;

  const report = await prisma.report.findFirst({
    where: { searchQueryId: searchId },
    orderBy: { createdAt: "desc" },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: report.id,
    title: report.title,
    searchQueryId: report.searchQueryId,
    sections: report.sections,
    createdAt: report.createdAt.toISOString(),
  });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ searchId: string }> }
) {
  const { searchId } = await params;

  const search = await prisma.searchExecution.findUnique({
    where: { id: searchId },
    include: {
      results: {
        orderBy: { rank: "asc" },
        include: {
          startup: {
            include: { teamMembers: true, metrics: true },
          },
        },
      },
    },
  });

  if (!search) {
    return NextResponse.json({ error: "Search not found" }, { status: 404 });
  }

  const reporter = new ReporterAgent();
  const ranked = search.results.map((r) => ({
    startup: r.startup,
    aiAnalysis: r.aiAnalysis as Record<string, unknown>,
    matchScore: r.matchScore,
    rank: r.rank,
  }));

  const report = await reporter.generateReport(ranked, search.bizPlan, searchId);

  return NextResponse.json(report, { status: 201 });
}
