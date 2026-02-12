import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const query = searchParams.get("query") ?? undefined;
  const industries = searchParams.get("industries")?.split(",").filter(Boolean) ?? [];
  const tags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
  const status = searchParams.get("status") ?? undefined;
  const stage = searchParams.get("stage") ?? undefined;
  const regions = searchParams.get("regions")?.split(",").filter(Boolean) ?? [];
  const maxTeamSize = Number(searchParams.get("maxTeamSize") ?? 0) || undefined;
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  const where: Record<string, unknown> = {};

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { oneLiner: { contains: query, mode: "insensitive" } },
      { longDescription: { contains: query, mode: "insensitive" } },
    ];
  }
  if (industries.length) where.industries = { hasSome: industries };
  if (tags.length) where.tags = { hasSome: tags };
  if (status) where.status = status;
  if (stage) where.stage = stage;
  if (regions.length) where.regions = { hasSome: regions };
  if (maxTeamSize) where.teamSize = { lte: maxTeamSize };

  const companies = await prisma.company.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json(
    companies.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      oneLiner: c.oneLiner,
      longDescription: c.longDescription.slice(0, 300),
      website: c.website,
      smallLogoUrl: c.smallLogoUrl,
      allLocations: c.allLocations,
      teamSize: c.teamSize,
      industries: c.industries,
      tags: c.tags,
      batch: c.batch,
      status: c.status,
      stage: c.stage,
      ycUrl: c.ycUrl,
    }))
  );
}
