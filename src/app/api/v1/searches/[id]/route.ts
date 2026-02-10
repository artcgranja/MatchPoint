import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Startup as StartupType } from "@/types";

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
          startup: {
            include: {
              teamMembers: true,
              metrics: true,
            },
          },
        },
      },
      stageLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!search) {
    return NextResponse.json({ error: "Search not found" }, { status: 404 });
  }

  const startups: StartupType[] = search.results.map((r) => ({
    id: r.startup.id,
    name: r.startup.name,
    logo: r.startup.logo,
    tagline: r.startup.tagline,
    description: r.startup.description,
    website: r.startup.website,
    founded: r.startup.founded,
    employees: r.startup.employees,
    location: r.startup.location,
    industries: r.startup.industries,
    technologies: r.startup.technologies,
    fundingStage: r.startup.fundingStage as StartupType["fundingStage"],
    totalFunding: r.startup.totalFunding,
    team: r.startup.teamMembers.map((t) => ({
      name: t.name,
      role: t.role,
      avatar: t.avatar,
      linkedin: t.linkedin ?? undefined,
    })),
    metrics: r.startup.metrics ?? {
      revenue: 0, revenueGrowth: 0, customers: 0, nps: 0, burnRate: 0, runway: 0,
    },
    aiAnalysis: r.aiAnalysis as unknown as StartupType["aiAnalysis"],
  }));

  return NextResponse.json({
    id: search.id,
    painPoint: search.painPoint,
    filters: search.filters,
    status: search.status,
    resultCount: search.resultCount,
    timestamp: search.createdAt.toISOString(),
    startups,
    stageLogs: search.stageLogs,
  });
}
