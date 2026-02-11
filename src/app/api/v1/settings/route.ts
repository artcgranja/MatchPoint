import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import type { UserSettings } from "@/types";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { settings: true },
  });

  const defaults: UserSettings = {
    theme: "dark",
    notificationsEnabled: true,
    compactView: false,
  };

  return NextResponse.json(dbUser?.settings ?? defaults);
}

export async function PUT(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  await prisma.user.update({
    where: { id: user.userId },
    data: { settings: body },
  });

  return NextResponse.json(body);
}
