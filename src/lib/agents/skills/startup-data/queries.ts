import { prisma } from "@/lib/db";

// Database queries used by the startup-data skill

export async function searchCompanies(filters: {
  query?: string;
  industries?: string[];
  tags?: string[];
  status?: string;
  stage?: string;
  regions?: string[];
  batch?: string;
  maxTeamSize?: number;
  isHiring?: boolean;
  topCompany?: boolean;
}) {
  const where: Record<string, unknown> = {};

  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: "insensitive" } },
      { oneLiner: { contains: filters.query, mode: "insensitive" } },
      { longDescription: { contains: filters.query, mode: "insensitive" } },
    ];
  }
  if (filters.industries?.length) {
    where.industries = { hasSome: filters.industries };
  }
  if (filters.tags?.length) {
    where.tags = { hasSome: filters.tags };
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.stage) {
    where.stage = filters.stage;
  }
  if (filters.regions?.length) {
    where.regions = { hasSome: filters.regions };
  }
  if (filters.batch) {
    where.batch = filters.batch;
  }
  if (filters.maxTeamSize) {
    where.teamSize = { lte: filters.maxTeamSize };
  }
  if (filters.isHiring !== undefined) {
    where.isHiring = filters.isHiring;
  }
  if (filters.topCompany !== undefined) {
    where.topCompany = filters.topCompany;
  }

  const companies = await prisma.company.findMany({
    where,
    take: 30,
  });

  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    oneLiner: c.oneLiner,
    longDescription: c.longDescription.slice(0, 200),
    industries: c.industries,
    tags: c.tags.slice(0, 5),
    batch: c.batch,
    status: c.status,
    stage: c.stage,
    allLocations: c.allLocations,
    teamSize: c.teamSize,
    website: c.website,
    ycUrl: c.ycUrl,
    smallLogoUrl: c.smallLogoUrl,
  }));
}

export async function getCompanyDetails(companyId: number) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) return null;

  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    oneLiner: company.oneLiner,
    longDescription: company.longDescription,
    website: company.website,
    smallLogoUrl: company.smallLogoUrl,
    allLocations: company.allLocations,
    teamSize: company.teamSize,
    industry: company.industry,
    subindustry: company.subindustry,
    industries: company.industries,
    tags: company.tags,
    batch: company.batch,
    status: company.status,
    stage: company.stage,
    regions: company.regions,
    topCompany: company.topCompany,
    isHiring: company.isHiring,
    nonprofit: company.nonprofit,
    ycUrl: company.ycUrl,
  };
}
