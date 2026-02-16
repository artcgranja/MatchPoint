import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { createSandbox } from "@/lib/e2b/client";
import { TEMPLATES } from "@/lib/e2b/templates";
import type { ProjectTemplate } from "@prisma/client";

export async function POST(req: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, template = "blank", description } = body as {
    name: string;
    template?: ProjectTemplate;
    description?: string;
  };

  if (!name || typeof name !== "string" || name.length < 1 || name.length > 200) {
    return NextResponse.json({ error: "name is required (max 200 chars)" }, { status: 400 });
  }

  const validTemplates = ["nextjs_webapp", "python_fastapi", "agent_workflow", "blank"];
  if (!validTemplates.includes(template)) {
    return NextResponse.json({ error: "Invalid template" }, { status: 400 });
  }

  // Generate slug from name
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  // Ensure unique slug for this user
  const existing = await prisma.builderProject.findMany({
    where: { userId: auth.userId, slug: { startsWith: baseSlug } },
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((p) => p.slug));
  let slug = baseSlug;
  let counter = 1;
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Create E2B sandbox
  let sandboxId: string | null = null;
  try {
    const sandbox = await createSandbox();
    sandboxId = sandbox.sandboxId;

    // Run template setup commands
    const templateConfig = TEMPLATES[template];
    if (templateConfig) {
      for (const cmd of templateConfig.setupCommands) {
        await sandbox.commands.run(cmd, { timeoutMs: 120_000 });
      }
    }
  } catch (error) {
    console.error("Failed to create sandbox:", error);
    // Continue without sandbox — can reconnect later
  }

  const project = await prisma.builderProject.create({
    data: {
      userId: auth.userId,
      name,
      slug,
      description: description ?? null,
      template,
      sandboxId,
    },
  });

  return NextResponse.json(project, { status: 201 });
}

export async function GET(req: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "active";
  const validStatuses = ["active", "paused", "archived", "all"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }

  const where: { userId: string; status?: "active" | "paused" | "archived" } = {
    userId: auth.userId,
  };
  if (status !== "all") {
    where.status = status as "active" | "paused" | "archived";
  }

  const projects = await prisma.builderProject.findMany({
    where,
    orderBy: { lastOpenedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      template: true,
      sandboxId: true,
      githubRepoUrl: true,
      status: true,
      lastOpenedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(projects);
}
