import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Startup as StartupType } from "@/types";

export async function POST(req: Request) {
  const body = await req.json();
  const { startupIds } = body;

  if (!Array.isArray(startupIds) || startupIds.length < 2) {
    return NextResponse.json(
      { error: "At least 2 startupIds are required" },
      { status: 400 }
    );
  }

  const startups = await prisma.startup.findMany({
    where: { id: { in: startupIds } },
    include: {
      teamMembers: true,
      metrics: true,
      searchResults: { take: 1, orderBy: { createdAt: "desc" } },
    },
  });

  const defaultAnalysis = {
    matchScore: 0,
    confidence: 0,
    strengths: [],
    weaknesses: [],
    opportunities: [],
    risks: [],
    synergySummary: "",
    radarScores: [],
  };

  const mapped: StartupType[] = startups.map((s) => ({
    id: s.id,
    name: s.name,
    logo: s.logo,
    tagline: s.tagline,
    description: s.description,
    website: s.website,
    founded: s.founded,
    employees: s.employees,
    location: s.location,
    industries: s.industries,
    technologies: s.technologies,
    fundingStage: s.fundingStage as StartupType["fundingStage"],
    totalFunding: s.totalFunding,
    team: s.teamMembers.map((t) => ({
      name: t.name,
      role: t.role,
      avatar: t.avatar,
      linkedin: t.linkedin ?? undefined,
    })),
    metrics: s.metrics ?? { revenue: 0, revenueGrowth: 0, customers: 0, nps: 0, burnRate: 0, runway: 0 },
    aiAnalysis: s.searchResults[0]
      ? (s.searchResults[0].aiAnalysis as unknown as StartupType["aiAnalysis"])
      : defaultAnalysis,
  }));

  return NextResponse.json({
    id: crypto.randomUUID(),
    startupIds,
    startups: mapped,
    createdAt: new Date().toISOString(),
  });
}
