import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { connectToSandbox } from "@/lib/e2b/client";
import { TEMPLATES } from "@/lib/e2b/templates";

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
  });

  if (!project || !project.sandboxId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const templateConfig = TEMPLATES[project.template];
  if (!templateConfig?.defaultPort) {
    return NextResponse.json({ error: "No preview available for this template" }, { status: 400 });
  }

  try {
    const sandbox = await connectToSandbox(project.sandboxId);
    const host = sandbox.getHost(templateConfig.defaultPort);
    return NextResponse.json({
      url: `https://${host}`,
      port: templateConfig.defaultPort,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to get preview URL" },
      { status: 500 }
    );
  }
}

export async function POST(
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

  if (!project || !project.sandboxId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const templateConfig = TEMPLATES[project.template];
  if (!templateConfig?.startCommand) {
    return NextResponse.json({ error: "No start command for this template" }, { status: 400 });
  }

  try {
    const sandbox = await connectToSandbox(project.sandboxId);
    // Start the dev server in the background
    sandbox.commands.run(templateConfig.startCommand, { timeoutMs: 0 });

    // Wait a bit for the server to start
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const host = sandbox.getHost(templateConfig.defaultPort!);
    return NextResponse.json({
      url: `https://${host}`,
      port: templateConfig.defaultPort,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to start dev server" },
      { status: 500 }
    );
  }
}
