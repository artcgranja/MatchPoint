import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = Number(id);

  if (isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id: numericId },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json({
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
  });
}
