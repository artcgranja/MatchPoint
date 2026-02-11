import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Startup as StartupType } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const startup = await prisma.startup.findUnique({
    where: { id },
    include: {
      teamMembers: true,
      metrics: true,
    },
  });

  if (!startup) {
    return NextResponse.json({ error: "Startup not found" }, { status: 404 });
  }

  const mapped: StartupType = {
    id: startup.id,
    name: startup.name,
    logo: startup.logo,
    tagline: startup.tagline,
    description: startup.description,
    website: startup.website,
    founded: startup.founded,
    employees: startup.employees,
    location: startup.location,
    industries: startup.industries,
    technologies: startup.technologies,
    fundingStage: startup.fundingStage as StartupType["fundingStage"],
    totalFunding: startup.totalFunding,
    team: startup.teamMembers.map((t) => ({
      name: t.name,
      role: t.role,
      avatar: t.avatar,
      linkedin: t.linkedin ?? undefined,
    })),
    metrics: startup.metrics ?? { revenue: 0, revenueGrowth: 0, customers: 0, nps: 0, burnRate: 0, runway: 0 },
  };

  return NextResponse.json(mapped);
}
