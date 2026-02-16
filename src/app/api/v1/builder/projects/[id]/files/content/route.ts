import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { connectToSandbox } from "@/lib/e2b/client";

const SANDBOX_ROOT = "/home/user/app";

function safePath(input: string): string | null {
  if (/[;&|`$(){}!#]/.test(input)) return null;
  const segments = input.split("/").filter(Boolean);
  const resolved: string[] = [];
  for (const seg of segments) {
    if (seg === "..") resolved.pop();
    else if (seg !== ".") resolved.push(seg);
  }
  const normalized = "/" + resolved.join("/");
  if (!normalized.startsWith(SANDBOX_ROOT)) return null;
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
  const rawPath = url.searchParams.get("path");

  if (!rawPath) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  const path = safePath(rawPath);
  if (!path) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const project = await prisma.builderProject.findFirst({
    where: { id, status: { not: "deleted" } },
  });

  if (!project || project.userId !== auth.userId || !project.sandboxId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const sandbox = await connectToSandbox(project.sandboxId);
    const content = await sandbox.files.read(path);
    return new Response(content, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

  const project = await prisma.builderProject.findFirst({
    where: { id, status: { not: "deleted" } },
  });

  if (!project || project.userId !== auth.userId || !project.sandboxId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const content = await req.text();
    const sandbox = await connectToSandbox(project.sandboxId);
    await sandbox.files.write(path, content);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to write file" },
      { status: 500 }
    );
  }
}
