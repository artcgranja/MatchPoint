import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdOrThrow } from "@/lib/auth";

export async function POST() {
  let userId: string;
  try {
    userId = await getUserIdOrThrow();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await prisma.discoverySession.create({
    data: {
      userId,
      currentPhase: "situation",
    },
  });

  return NextResponse.json({ id: session.id, currentPhase: session.currentPhase }, { status: 201 });
}
