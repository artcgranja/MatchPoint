import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdOrThrow } from "@/lib/auth";

export async function GET(req: NextRequest) {
  let userId: string;
  try {
    userId = await getUserIdOrThrow();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const query = searchParams.get("query") ?? undefined;
  const industries = searchParams.get("industries")?.split(",").filter(Boolean) ?? [];
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Math.min(Number(searchParams.get("limit") ?? 12), 100);

  const companyWhere: Record<string, unknown> = {};

  if (query) {
    companyWhere.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { oneLiner: { contains: query, mode: "insensitive" } },
      { longDescription: { contains: query, mode: "insensitive" } },
    ];
  }
  if (industries.length) companyWhere.industries = { hasSome: industries };

  const where = {
    userId,
    company: companyWhere,
  };

  const [savedStartups, total] = await Promise.all([
    prisma.savedStartup.findMany({
      where,
      include: { company: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.savedStartup.count({ where }),
  ]);

  return NextResponse.json({
    data: savedStartups.map((s) => ({
      id: s.company.id,
      name: s.company.name,
      slug: s.company.slug,
      oneLiner: s.company.oneLiner,
      longDescription: s.company.longDescription.slice(0, 300),
      website: s.company.website,
      smallLogoUrl: s.company.smallLogoUrl,
      allLocations: s.company.allLocations,
      teamSize: s.company.teamSize,
      industries: s.company.industries,
      tags: s.company.tags,
      batch: s.company.batch,
      status: s.company.status,
      stage: s.company.stage,
      ycUrl: s.company.ycUrl,
    })),
    total,
    page,
    limit,
  });
}

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await getUserIdOrThrow();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { companyId } = await req.json();
  if (typeof companyId !== "number") {
    return NextResponse.json({ error: "companyId must be a number" }, { status: 400 });
  }

  await prisma.savedStartup.upsert({
    where: { userId_companyId: { userId, companyId } },
    create: { userId, companyId },
    update: {},
  });

  return NextResponse.json({ success: true });
}
