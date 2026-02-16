import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { createSandbox, connectToSandbox } from "@/lib/e2b/client";
import { TEMPLATES } from "@/lib/e2b/templates";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const project = await prisma.builderProject.findUnique({
    where: { id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.userId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Try to reconnect to existing sandbox
  if (project.sandboxId) {
    try {
      const sandbox = await connectToSandbox(project.sandboxId);
      return NextResponse.json({
        sandboxId: sandbox.sandboxId,
        reconnected: true,
      });
    } catch {
      // Sandbox expired — create a new one
    }
  }

  // Create a new sandbox
  const sandbox = await createSandbox();
  const sandboxId = sandbox.sandboxId;

  // Run template setup if needed
  const templateConfig = TEMPLATES[project.template];
  if (templateConfig) {
    for (const cmd of templateConfig.setupCommands) {
      await sandbox.commands.run(cmd, { timeoutMs: 120_000 });
    }
  }

  await prisma.builderProject.update({
    where: { id },
    data: { sandboxId },
  });

  return NextResponse.json({ sandboxId, reconnected: false });
}
