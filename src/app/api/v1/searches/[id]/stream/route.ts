import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runPipeline } from "@/lib/agents/orchestrator";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const search = await prisma.searchExecution.findUnique({ where: { id } });
  if (!search) {
    return NextResponse.json({ error: "Search not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        for await (const event of runPipeline(id)) {
          send(event.eventType, event);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Pipeline failed";
        send("error", { message });
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
