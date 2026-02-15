import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, role: true, companyId: true },
  });

  if (!user || user.role !== "builder") {
    return NextResponse.json({ error: "Only builders can create companies" }, { status: 403 });
  }

  if (user.companyId) {
    return NextResponse.json({ error: "Company already exists" }, { status: 409 });
  }

  const body = (await request.json()) as {
    name?: string;
    oneLiner?: string;
    longDescription?: string;
    website?: string;
    industry?: string;
    contactEmail?: string;
    location?: string;
  };

  if (!body.name || !body.oneLiner || !body.industry || !body.contactEmail) {
    return NextResponse.json({ error: "Missing required fields: name, oneLiner, industry, contactEmail" }, { status: 400 });
  }

  const slug = slugify(body.name) + "-" + Date.now().toString(36);

  const company = await prisma.company.create({
    data: {
      name: body.name,
      slug,
      oneLiner: body.oneLiner,
      longDescription: body.longDescription ?? "",
      website: body.website ?? "",
      smallLogoUrl: "",
      allLocations: body.location ?? "",
      teamSize: 1,
      industry: body.industry,
      subindustry: "",
      industries: [body.industry],
      tags: [],
      batch: "Independent",
      status: "Active",
      stage: "Early",
      regions: [],
      ycUrl: "",
      contactEmail: body.contactEmail,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { companyId: company.id },
  });

  return NextResponse.json(company, { status: 201 });
}

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { companyId: true },
  });

  if (!user?.companyId) {
    return NextResponse.json({ error: "No company linked" }, { status: 404 });
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
  });

  return NextResponse.json(company);
}

export async function PUT(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true, companyId: true },
  });

  if (!user || user.role !== "builder" || !user.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    oneLiner?: string;
    longDescription?: string;
    website?: string;
    industry?: string;
    contactEmail?: string;
    location?: string;
    isHiring?: boolean;
  };

  const company = await prisma.company.update({
    where: { id: user.companyId },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.oneLiner && { oneLiner: body.oneLiner }),
      ...(body.longDescription !== undefined && { longDescription: body.longDescription }),
      ...(body.website !== undefined && { website: body.website }),
      ...(body.industry && { industry: body.industry, industries: [body.industry] }),
      ...(body.contactEmail && { contactEmail: body.contactEmail }),
      ...(body.location !== undefined && { allLocations: body.location }),
      ...(body.isHiring !== undefined && { isHiring: body.isHiring }),
    },
  });

  return NextResponse.json(company);
}
