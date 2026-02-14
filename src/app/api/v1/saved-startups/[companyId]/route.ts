import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdOrThrow } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ companyId: string }> }
) {
  let userId: string;
  try {
    userId = await getUserIdOrThrow();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { companyId } = await props.params;
  const id = Number(companyId);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
  }

  await prisma.savedStartup.deleteMany({
    where: { userId, companyId: id },
  });

  return NextResponse.json({ success: true });
}
