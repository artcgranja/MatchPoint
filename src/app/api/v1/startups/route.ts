import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Startup as StartupType } from "@/types";

function mapStartup(s: {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  description: string;
  website: string;
  founded: number;
  employees: number;
  location: string;
  industries: string[];
  technologies: string[];
  fundingStage: string;
  totalFunding: number;
  teamMembers: { name: string; role: string; avatar: string; linkedin: string | null }[];
  metrics: { revenue: number; revenueGrowth: number; customers: number; nps: number; burnRate: number; runway: number } | null;
  searchResults: { aiAnalysis: unknown }[];
}): StartupType {
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

  return {
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
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const industries = searchParams.get("industries")?.split(",").filter(Boolean) ?? [];
  const fundingStages = searchParams.get("fundingStages")?.split(",").filter(Boolean) ?? [];
  const locations = searchParams.get("locations")?.split(",").filter(Boolean) ?? [];
  const technologies = searchParams.get("technologies")?.split(",").filter(Boolean) ?? [];
  const minMatchScore = Number(searchParams.get("minMatchScore") ?? 0);
  const maxEmployeeCount = Number(searchParams.get("maxEmployeeCount") ?? 100000);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 50);
  const searchId = searchParams.get("searchId");

  const where: Record<string, unknown> = {};
  if (industries.length) where.industries = { hasSome: industries };
  if (fundingStages.length) where.fundingStage = { in: fundingStages };
  if (locations.length) where.location = { in: locations };
  if (technologies.length) where.technologies = { hasSome: technologies };
  if (maxEmployeeCount < 100000) where.employees = { lte: maxEmployeeCount };

  const startups = await prisma.startup.findMany({
    where,
    include: {
      teamMembers: true,
      metrics: true,
      searchResults: searchId
        ? { where: { searchExecutionId: searchId }, orderBy: { rank: "asc" } }
        : { take: 1, orderBy: { createdAt: "desc" } },
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  const mapped = startups.map(mapStartup);

  if (minMatchScore > 0) {
    return NextResponse.json(mapped.filter((s) => s.aiAnalysis.matchScore >= minMatchScore));
  }

  return NextResponse.json(mapped);
}
