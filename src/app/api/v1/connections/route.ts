import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, generateMagicLinkToken } from "@/lib/auth";
import { outreachAgent } from "@/lib/agents/outreach";
import { sendConnectionInvite } from "@/lib/email/send";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user || user.role !== "seeker") {
    return NextResponse.json({ error: "Only seekers can create connections" }, { status: 403 });
  }

  const { companyId, searchResultId } = (await request.json()) as {
    companyId?: number;
    searchResultId?: string;
  };

  if (!companyId || typeof companyId !== "number") {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  // Check company exists and has contactEmail
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, oneLiner: true, contactEmail: true },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const contactEmail = company.contactEmail || process.env.FALLBACK_CONTACT_EMAIL;
  if (!contactEmail) {
    return NextResponse.json({ error: "Company has no contact email" }, { status: 422 });
  }

  // Check uniqueness
  const existing = await prisma.connection.findUnique({
    where: { seekerId_companyId: { seekerId: user.id, companyId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Connection already exists", connection: { id: existing.id, status: existing.status } }, { status: 409 });
  }

  // Rate limit: max 10 connections per day per seeker
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dailyCount = await prisma.connection.count({
    where: { seekerId: user.id, createdAt: { gte: oneDayAgo } },
  });

  if (dailyCount >= 10) {
    return NextResponse.json({ error: "Daily connection limit reached" }, { status: 429 });
  }

  // Gather context for outreach email
  let whyRelevant = "";
  let needSummary: Record<string, unknown> = {};
  let bizPlan: string | null = null;

  // Try to get context from search result
  if (searchResultId) {
    const searchResult = await prisma.searchResult.findUnique({
      where: { id: searchResultId },
      include: {
        searchExecution: {
          include: {
            discoverySession: {
              select: { bizPlan: true },
            },
          },
        },
      },
    });

    if (searchResult) {
      const analysis = searchResult.aiAnalysis as Record<string, unknown>;
      whyRelevant = (analysis?.whyRelevant as string) ?? "";
      bizPlan = searchResult.searchExecution.bizPlan
        ? JSON.stringify(searchResult.searchExecution.bizPlan)
        : null;

      // Get NeedSummary from the discovery session's bizPlan or search filters
      const filters = searchResult.searchExecution.filters as Record<string, unknown>;
      needSummary = filters ?? {};

      if (searchResult.searchExecution.discoverySession?.bizPlan) {
        bizPlan = JSON.stringify(searchResult.searchExecution.discoverySession.bizPlan);
      }
    }
  }

  // Fallback: find the most recent search result for this company by this user
  if (!whyRelevant) {
    const latestResult = await prisma.searchResult.findFirst({
      where: {
        companyId,
        searchExecution: { userId: user.id },
      },
      orderBy: { createdAt: "desc" },
      include: {
        searchExecution: {
          include: {
            discoverySession: { select: { bizPlan: true } },
          },
        },
      },
    });

    if (latestResult) {
      const analysis = latestResult.aiAnalysis as Record<string, unknown>;
      whyRelevant = (analysis?.whyRelevant as string) ?? "";
      const filters = latestResult.searchExecution.filters as Record<string, unknown>;
      needSummary = filters ?? {};

      if (latestResult.searchExecution.discoverySession?.bizPlan) {
        bizPlan = JSON.stringify(latestResult.searchExecution.discoverySession.bizPlan);
      }
    }
  }

  // Generate outreach email via Opus
  const email = await outreachAgent.generateEmail({
    needSummary,
    bizPlan,
    startupName: company.name,
    startupOneLiner: company.oneLiner,
    whyRelevant,
    seekerCompany: user.name ?? undefined,
  });

  // Create connection record
  const connection = await prisma.connection.create({
    data: {
      seekerId: user.id,
      companyId,
      searchResultId: searchResultId ?? undefined,
      status: "pending",
      emailSubject: email.subject,
      emailBody: email.body,
      builderEmail: contactEmail,
    },
  });

  // Generate magic link token for builder
  const token = generateMagicLinkToken();
  await prisma.magicLinkToken.create({
    data: {
      email: contactEmail,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days for invites
      connectionId: connection.id,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const inviteUrl = `${appUrl}/api/v1/auth/magic-link/verify?token=${token}`;

  // Send email
  try {
    const resendId = await sendConnectionInvite({
      to: contactEmail,
      startupName: company.name,
      subject: email.subject,
      body: email.body,
      inviteUrl,
      seekerCompany: user.name ?? undefined,
    });

    await prisma.connection.update({
      where: { id: connection.id },
      data: {
        status: "email_sent",
        emailSentAt: new Date(),
        resendEmailId: resendId,
      },
    });
  } catch (err) {
    console.error("[connections] Failed to send invite email:", err);
    // Connection stays in pending status
  }

  return NextResponse.json({ id: connection.id, status: "email_sent" }, { status: 201 });
}

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, role: true, companyId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const connections = await prisma.connection.findMany({
    where: user.role === "seeker"
      ? { seekerId: user.id }
      : { companyId: user.companyId ?? -1 },
    include: {
      company: { select: { id: true, name: true, oneLiner: true, smallLogoUrl: true } },
      seeker: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(connections);
}
