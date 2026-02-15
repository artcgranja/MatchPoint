import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, role: true, companyId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const connection = await prisma.connection.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true, oneLiner: true, smallLogoUrl: true } },
      seeker: { select: { id: true, name: true, email: true } },
    },
  });

  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  // ACL: only the seeker who created it or the builder linked to the company
  const isSeeker = connection.seekerId === user.id;
  const isBuilder = user.role === "builder" && user.companyId === connection.companyId;

  if (!isSeeker && !isBuilder) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(connection);
}
