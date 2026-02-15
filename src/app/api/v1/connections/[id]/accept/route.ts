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

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true, companyId: true },
  });

  if (!user || user.role !== "builder" || !user.companyId) {
    return NextResponse.json({ error: "Only builders can accept connections" }, { status: 403 });
  }

  const { id } = await props.params;

  const connection = await prisma.connection.findUnique({
    where: { id },
  });

  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  if (connection.companyId !== user.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (connection.status === "accepted") {
    return NextResponse.json({ error: "Already accepted" }, { status: 409 });
  }

  const updated = await prisma.connection.update({
    where: { id },
    data: { status: "accepted" },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
