import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

const K_ANONYMITY_THRESHOLD = 5;

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (auth.role !== "builder") {
    return NextResponse.json(
      { error: "Only builders can view product insights" },
      { status: 403 }
    );
  }

  const concepts = await prisma.productConcept.findMany({
    where: { demandCount: { gte: K_ANONYMITY_THRESHOLD } },
    select: {
      id: true,
      name: true,
      definition: true,
      category: true,
      demandCount: true,
      firstSeenAt: true,
      lastSeenAt: true,
    },
    orderBy: { demandCount: "desc" },
    take: 50,
  });

  return NextResponse.json(concepts);
}
