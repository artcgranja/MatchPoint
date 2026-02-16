import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { handleBuilderMessage } from "@/lib/builder/orchestrator";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { message } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  if (message.length > 20_000) {
    return NextResponse.json(
      { error: "Message too long (max 20000 characters)" },
      { status: 400 }
    );
  }

  const project = await prisma.builderProject.findUnique({
    where: { id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.userId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const encoder = new TextEncoder();
  const abortController = new AbortController();
  const { signal } = abortController;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: object) => {
        if (signal.aborted || controller.desiredSize === null) return;
        try {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
            )
          );
        } catch {
          abortController.abort();
        }
      };

      try {
        for await (const event of handleBuilderMessage(
          id,
          message,
          auth.userId
        )) {
          if (signal.aborted) break;
          sendEvent(event.type, event);
        }
      } catch (error) {
        if (!signal.aborted) {
          const msg =
            error instanceof Error ? error.message : "Internal error";
          sendEvent("error", { type: "error", message: msg });
        }
      } finally {
        if (!signal.aborted) {
          controller.close();
        }
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
