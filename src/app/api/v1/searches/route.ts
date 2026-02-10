import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import type { SearchQuery } from "@/types";

export async function GET() {
  const user = await getAuthUser();

  const where = user ? { userId: user.userId } : {};

  const searches = await prisma.searchExecution.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const mapped: SearchQuery[] = searches.map((s) => ({
    id: s.id,
    painPoint: s.painPoint,
    filters: s.filters as unknown as SearchQuery["filters"],
    timestamp: s.createdAt.toISOString(),
    status: s.status,
    resultCount: s.resultCount,
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { painPoint, filters, discoverySessionId } = body;

  if (!painPoint || typeof painPoint !== "string") {
    return NextResponse.json({ error: "painPoint is required" }, { status: 400 });
  }

  // Get or create a default user for MVP (no auth required to create searches)
  let userId: string;
  const user = await getAuthUser();
  if (user) {
    userId = user.userId;
  } else {
    // Use or create a default user
    const defaultUser = await prisma.user.upsert({
      where: { email: "default@matchpoint.ai" },
      update: {},
      create: {
        email: "default@matchpoint.ai",
        hashedPassword: "not-a-real-password",
      },
    });
    userId = defaultUser.id;
  }

  const defaultFilters = {
    industries: [],
    fundingStages: [],
    locations: [],
    minMatchScore: 0,
    maxEmployeeCount: 10000,
    technologies: [],
  };

  // If linked to a discovery session, fetch its bizPlan
  let bizPlan = undefined;
  if (discoverySessionId) {
    const session = await prisma.discoverySession.findUnique({
      where: { id: discoverySessionId },
      select: { bizPlan: true },
    });
    if (session?.bizPlan) {
      bizPlan = session.bizPlan;
    }
  }

  const search = await prisma.searchExecution.create({
    data: {
      userId,
      painPoint,
      filters: filters ?? defaultFilters,
      status: "idle",
      ...(discoverySessionId && { discoverySessionId }),
      ...(bizPlan && { bizPlan }),
    },
  });

  return NextResponse.json({ id: search.id }, { status: 201 });
}
