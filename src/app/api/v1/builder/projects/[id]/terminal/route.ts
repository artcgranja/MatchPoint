import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { connectToSandbox } from "@/lib/e2b/client";

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

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!project.sandboxId) {
    return NextResponse.json(
      { error: "No sandbox available" },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  const abortController = new AbortController();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const sandbox = await connectToSandbox(project.sandboxId!);

        // Start a PTY shell with onData callback
        const handle = await sandbox.pty.create({
          rows: 24,
          cols: 80,
          cwd: "/home/user/app",
          onData: (data: Uint8Array) => {
            if (abortController.signal.aborted) return;
            try {
              const text = new TextDecoder().decode(data);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ output: text })}\n\n`
                )
              );
            } catch {
              abortController.abort();
            }
          },
        });

        // Keep alive
        const keepAlive = setInterval(() => {
          if (abortController.signal.aborted) {
            clearInterval(keepAlive);
            return;
          }
          try {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
          } catch {
            clearInterval(keepAlive);
            abortController.abort();
          }
        }, 30_000);

        abortController.signal.addEventListener("abort", () => {
          clearInterval(keepAlive);
          sandbox.commands.kill(handle.pid).catch(() => {});
        });
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Failed to connect";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ output: `\r\nError: ${msg}\r\n` })}\n\n`
          )
        );
        controller.close();
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
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

  let body: { input?: unknown; pid?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { input, pid } = body;

  if (typeof input !== "string") {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  const project = await prisma.builderProject.findFirst({
    where: { id, userId: auth.userId, status: { not: "deleted" } },
  });

  if (!project || !project.sandboxId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ptyPid = typeof pid === "number" && pid > 0 ? pid : 1;

  try {
    const sandbox = await connectToSandbox(project.sandboxId);
    const data = new TextEncoder().encode(input as string);
    await sandbox.pty.sendInput(ptyPid, data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to send input" },
      { status: 500 }
    );
  }
}
