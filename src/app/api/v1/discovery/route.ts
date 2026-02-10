import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST() {
  let userId: string;
  const user = await getAuthUser();
  if (user) {
    userId = user.userId;
  } else {
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

  const session = await prisma.discoverySession.create({
    data: {
      userId,
      currentPhase: "situation",
    },
  });

  return NextResponse.json({ id: session.id, currentPhase: session.currentPhase }, { status: 201 });
}
