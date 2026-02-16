import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { destroySandbox } from "@/lib/e2b/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const project = await prisma.builderProject.findFirst({
    where: { id, userId: auth.userId, status: { not: "deleted" } },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Update lastOpenedAt
  await prisma.builderProject.update({
    where: { id },
    data: { lastOpenedAt: new Date() },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const project = await prisma.builderProject.findFirst({
    where: { id, userId: auth.userId, status: { not: "deleted" } },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Destroy sandbox if active (don't block soft-delete on failure)
  if (project.sandboxId) {
    try {
      await destroySandbox(project.sandboxId);
    } catch {
      // Sandbox may already be expired — continue with soft delete
    }
  }

  // Soft delete
  await prisma.builderProject.update({
    where: { id },
    data: { status: "deleted" },
  });

  return NextResponse.json({ success: true });
}
