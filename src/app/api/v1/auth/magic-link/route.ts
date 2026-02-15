import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateMagicLinkToken } from "@/lib/auth";
import { sendMagicLink } from "@/lib/email/send";

export async function POST(request: Request) {
  const { email, role } = (await request.json()) as { email?: string; role?: string };

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Rate limit: max 3 per email per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.magicLinkToken.count({
    where: {
      email: normalizedEmail,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentCount >= 3) {
    // Return success regardless to not leak information
    return NextResponse.json({ ok: true });
  }

  const token = generateMagicLinkToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.magicLinkToken.create({
    data: {
      email: normalizedEmail,
      token,
      expiresAt,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const roleParam = role === "builder" ? "&role=builder" : "";
  const loginUrl = `${appUrl}/api/v1/auth/magic-link/verify?token=${token}${roleParam}`;

  try {
    await sendMagicLink({ to: normalizedEmail, loginUrl });
  } catch (err) {
    console.error("[magic-link] Failed to send email:", err);
  }

  // Always return success to not reveal if email exists
  return NextResponse.json({ ok: true });
}
