import { prisma } from "@/lib/db";

// Database tools used by agents for querying startup data

export async function searchStartups(filters: {
  industries?: string[];
  technologies?: string[];
  fundingStages?: string[];
  maxEmployees?: number;
  location?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters.industries?.length) {
    where.industries = { hasSome: filters.industries };
  }
  if (filters.technologies?.length) {
    where.technologies = { hasSome: filters.technologies };
  }
  if (filters.fundingStages?.length) {
    where.fundingStage = { in: filters.fundingStages };
  }
  if (filters.maxEmployees) {
    where.employees = { lte: filters.maxEmployees };
  }

  const startups = await prisma.startup.findMany({
    where,
    include: { metrics: true },
    take: 50,
  });

  return startups.map((s) => ({
    id: s.id,
    name: s.name,
    tagline: s.tagline,
    description: s.description.slice(0, 200),
    industries: s.industries,
    technologies: s.technologies,
    fundingStage: s.fundingStage,
    employees: s.employees,
    location: s.location,
    totalFunding: s.totalFunding,
    revenue: s.metrics?.revenue ?? 0,
    revenueGrowth: s.metrics?.revenueGrowth ?? 0,
  }));
}

export async function getStartupDetails(startupId: string) {
  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    include: { teamMembers: true, metrics: true },
  });

  if (!startup) return null;

  return {
    id: startup.id,
    name: startup.name,
    tagline: startup.tagline,
    description: startup.description,
    industries: startup.industries,
    technologies: startup.technologies,
    fundingStage: startup.fundingStage,
    employees: startup.employees,
    location: startup.location,
    totalFunding: startup.totalFunding,
    team: startup.teamMembers.map((t) => ({
      name: t.name,
      role: t.role,
    })),
    metrics: startup.metrics
      ? {
          revenue: startup.metrics.revenue,
          revenueGrowth: startup.metrics.revenueGrowth,
          customers: startup.metrics.customers,
          nps: startup.metrics.nps,
          burnRate: startup.metrics.burnRate,
          runway: startup.metrics.runway,
        }
      : null,
  };
}
