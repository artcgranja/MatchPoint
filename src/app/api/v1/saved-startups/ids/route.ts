import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdOrThrow } from "@/lib/auth";

export async function GET() {
  let userId: string;
  try {
    userId = await getUserIdOrThrow();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const saved = await prisma.savedStartup.findMany({
    where: { userId },
    select: { companyId: true },
  });

  return NextResponse.json({ ids: saved.map((s) => s.companyId) });
}
