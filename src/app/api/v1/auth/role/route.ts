import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, signToken } from "@/lib/auth";

export async function PUT(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = (await request.json()) as { role?: string };
  if (role !== "seeker" && role !== "builder") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, email: true, role: true, roleChosenAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.roleChosenAt) {
    return NextResponse.json({ error: "Role already chosen" }, { status: 409 });
  }

  const now = new Date();
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role, roleChosenAt: now },
    select: { id: true, email: true, name: true, avatarUrl: true, role: true, roleChosenAt: true },
  });

  const token = await signToken({
    userId: updated.id,
    email: updated.email,
    role: updated.role as "seeker" | "builder",
    roleChosenAt: now.toISOString(),
  });

  const response = NextResponse.json(updated);
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
