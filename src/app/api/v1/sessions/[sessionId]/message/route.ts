import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { handleMessage } from "@/lib/agents/state-machine";

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
  const { message } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "message is required" },
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

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      const sendEvent = (event: string, data: object) => {
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          )
        );
      };

      try {
        for await (const event of handleMessage(sessionId, message)) {
          switch (event.type) {
            case "text":
              send({ text: event.text });
              break;

            case "done":
              if (event.transition) {
                send({
                  done: true,
                  transition: event.transition,
                  searchId: event.searchId,
                });
              } else {
                send({ done: true });
              }
              break;

            case "analysis_thinking":
              sendEvent("analysis_thinking", { data: { text: event.text } });
              break;

            case "analysis_text":
              sendEvent("analysis_text", { data: { text: event.text } });
              break;

            case "analysis_complete":
              sendEvent("analysis_complete", { data: event.data });
              break;

            case "scout_event":
              sendEvent(event.event.eventType, event.event);
              break;

            case "advisor_text":
              send({ text: event.text });
              break;

            case "advisor_done":
              send({ done: true });
              break;

            case "status":
              send({ status: event.message });
              break;

            case "error":
              send({ error: event.message });
              break;
          }
        }
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Internal error";
        send({ error: msg });
      } finally {
        controller.close();
      }
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
