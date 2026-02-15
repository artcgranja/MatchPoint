import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function PUT(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;

  const notification = await prisma.notification.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!notification) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (notification.read) {
    return NextResponse.json({ success: true });
  }

  await prisma.notification.update({
    where: { id },
    data: { read: true, readAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
