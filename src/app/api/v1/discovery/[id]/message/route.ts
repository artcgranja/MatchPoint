import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DiscoveryAgent } from "@/lib/agents/navigator";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { message } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  if (message.length > 10_000) {
    return NextResponse.json(
      { error: "Message too long (max 10000 characters)" },
      { status: 400 }
    );
  }

  const session = await prisma.discoverySession.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Save user message
  await prisma.discoveryMessage.create({
    data: {
      sessionId: id,
      role: "user",
      content: message,
      phase: session.currentPhase,
    },
  });

  const encoder = new TextEncoder();
  const discovery = new DiscoveryAgent();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = "";
        for await (const event of discovery.chat(id, message)) {
          if (event.type === "text") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.text })}\n\n`));
            fullResponse += event.text;
          } else if (event.type === "done") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          }
        }

        // Save assistant message
        const updatedSession = await prisma.discoverySession.findUnique({
          where: { id },
        });
        await prisma.discoveryMessage.create({
          data: {
            sessionId: id,
            role: "assistant",
            content: fullResponse,
            phase: updatedSession?.currentPhase ?? session.currentPhase,
          },
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Discovery failed";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
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
