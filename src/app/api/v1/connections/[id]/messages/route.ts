import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

async function getConnectionWithACL(connectionId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, companyId: true },
  });

  if (!user) return null;

  const connection = await prisma.connection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) return null;

  const isSeeker = user.role === "seeker" && connection.seekerId === user.id;
  const isBuilder = user.role === "builder" && user.companyId === connection.companyId;

  if (!isSeeker && !isBuilder) return null;

  return connection;
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  const connection = await getConnectionWithACL(id, auth.userId);
  if (!connection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const after = url.searchParams.get("after");

  const messages = await prisma.connectionMessage.findMany({
    where: {
      connectionId: id,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    include: {
      sender: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  const connection = await getConnectionWithACL(id, auth.userId);
  if (!connection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (connection.status !== "accepted") {
    return NextResponse.json(
      { error: "Connection must be accepted before chatting" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!content || content.length > 5000) {
    return NextResponse.json(
      { error: "content is required (max 5000 chars)" },
      { status: 400 }
    );
  }

  const message = await prisma.connectionMessage.create({
    data: {
      connectionId: id,
      senderId: auth.userId,
      content,
      isSystem: false,
    },
    include: {
      sender: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(message, { status: 201 });
}
