import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { handleMessage, type BackgroundJob } from "@/lib/agents/state-machine";
import { extractProductConcept } from "@/lib/agents/jobs/extract-product-concept";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const body = await req.json();
  const { message, answers } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 }
    );
  }

  if (message.length > 10_000) {
    return NextResponse.json(
      { error: "Message too long (max 10000 characters)" },
      { status: 400 }
    );
  }

  const session = await prisma.discoverySession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    );
  }

  if (session.userId !== auth.userId) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const encoder = new TextEncoder();
  const abortController = new AbortController();
  const { signal } = abortController;
  const backgroundJobs: BackgroundJob[] = [];

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
        for await (const event of handleMessage(sessionId, message, answers)) {
          if (signal.aborted) break;
          // Intercept internal background events — don't send to client
          if (event.type === "_background") {
            backgroundJobs.push(event);
            continue;
          }
          sendEvent(event.type, event);
        }
      } catch (error) {
        if (!signal.aborted) {
          const msg =
            error instanceof Error ? error.message : "Internal error";
          sendEvent("error", { type: "error", agent: "system", message: msg });
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

  // Schedule background jobs to run after the response is fully sent.
  // after() guarantees execution even after the SSE stream closes,
  // unlike fire-and-forget Promises which can be killed in serverless.
  after(async () => {
    for (const job of backgroundJobs) {
      if (job.job === "extract_product_concept") {
        try {
          await extractProductConcept(job.searchId);
        } catch (err) {
          console.error("[after] Background concept extraction failed:", err);
        }
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
