import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { connectToSandbox } from "@/lib/e2b/client";

const SANDBOX_ROOT = "/home/user/app";

/** Validate and normalize a sandbox path to prevent traversal attacks. */
function safePath(input: string): string | null {
  // Reject shell metacharacters
  if (/[;&|`$(){}!#]/.test(input)) return null;
  // Normalize away relative segments
  const segments = input.split("/").filter(Boolean);
  const resolved: string[] = [];
  for (const seg of segments) {
    if (seg === "..") resolved.pop();
    else if (seg !== ".") resolved.push(seg);
  }
  const normalized = "/" + resolved.join("/");
  if (normalized !== SANDBOX_ROOT && !normalized.startsWith(SANDBOX_ROOT + "/"))
    return null;
  return normalized;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const rawPath = url.searchParams.get("path") ?? SANDBOX_ROOT;
  const path = safePath(rawPath);
  if (!path) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const project = await prisma.builderProject.findFirst({
    where: { id, userId: auth.userId, status: { not: "deleted" } },
  });

  if (!project || !project.sandboxId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const sandbox = await connectToSandbox(project.sandboxId);
    const entries = await sandbox.files.list(path);
    const tree = entries.map((entry) => ({
      name: entry.name,
      path: entry.path,
      type: entry.type === "dir" ? "directory" : "file",
    }));
    return NextResponse.json(tree);
  } catch {
    return NextResponse.json(
      { error: "Failed to list directory" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { path?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { path: rawPath, type } = body as { path: string; type: "file" | "directory" };

  if (!rawPath) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  const path = safePath(rawPath);
  if (!path) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const project = await prisma.builderProject.findFirst({
    where: { id, userId: auth.userId, status: { not: "deleted" } },
  });

  if (!project || !project.sandboxId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const sandbox = await connectToSandbox(project.sandboxId);
    if (type === "directory") {
      await sandbox.commands.run(`mkdir -p "${path}"`);
    } else {
      const dir = path.substring(0, path.lastIndexOf("/"));
      if (dir) await sandbox.commands.run(`mkdir -p "${dir}"`);
      await sandbox.files.write(path, "");
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const rawPath = url.searchParams.get("path");

  if (!rawPath) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  const path = safePath(rawPath);
  if (!path) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // Prevent deletion of the project root
  if (path === SANDBOX_ROOT) {
    return NextResponse.json(
      { error: "Cannot delete the project root directory" },
      { status: 400 }
    );
  }

  const project = await prisma.builderProject.findFirst({
    where: { id, userId: auth.userId, status: { not: "deleted" } },
  });

  if (!project || !project.sandboxId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const sandbox = await connectToSandbox(project.sandboxId);
    await sandbox.commands.run(`rm -rf "${path}"`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
