import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!token) {
    return NextResponse.redirect(`${appUrl}/?auth_error=invalid_token`);
  }

  // Find and validate token atomically
  const magicLink = await prisma.$transaction(async (tx) => {
    const found = await tx.magicLinkToken.findUnique({
      where: { token },
    });

    if (!found || found.usedAt || found.expiresAt < new Date()) {
      return null;
    }

    // Mark as used
    return tx.magicLinkToken.update({
      where: { id: found.id },
      data: { usedAt: new Date() },
    });
  });

  if (!magicLink) {
    return NextResponse.redirect(`${appUrl}/?auth_error=invalid_token`);
  }

  // Find or create user as builder
  let user = await prisma.user.findUnique({
    where: { email: magicLink.email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: magicLink.email,
        role: "builder",
      },
    });
  }

  // If token has connectionId, link builder to company and accept connection
  if (magicLink.connectionId) {
    const connection = await prisma.connection.findUnique({
      where: { id: magicLink.connectionId },
    });

    if (connection) {
      await prisma.$transaction([
        // Link user to company if not already linked
        ...(user.companyId !== connection.companyId
          ? [
              prisma.user.update({
                where: { id: user.id },
                data: { companyId: connection.companyId, role: "builder" },
              }),
            ]
          : []),
        // Update connection status
        prisma.connection.update({
          where: { id: connection.id },
          data: { status: "accepted" },
        }),
      ]);

      // Refresh user after potential update
      user = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    }
  }

  // Issue JWT
  const jwt = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role as "seeker" | "builder",
  });

  const response = NextResponse.redirect(`${appUrl}/`);

  response.cookies.set("token", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
