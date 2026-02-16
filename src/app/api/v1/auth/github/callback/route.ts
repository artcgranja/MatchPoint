import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Read state + role cookies
  const cookieStore = await cookies();
  const storedState = cookieStore.get("github_oauth_state")?.value ?? null;
  const loginRole = cookieStore.get("login_role")?.value as "seeker" | "builder" | undefined;

  if (!code || !state || !storedState || state !== storedState) {
    const response = NextResponse.redirect(`${appUrl}/?auth_error=invalid_state`);
    response.cookies.delete("github_oauth_state");
    return response;
  }

  // Exchange code for access token
  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    }
  );

  const tokenData = await tokenResponse.json();
  if (tokenData.error) {
    const response = NextResponse.redirect(`${appUrl}/?auth_error=token_exchange`);
    response.cookies.delete("github_oauth_state");
    return response;
  }

  const accessToken = tokenData.access_token as string;

  // Store encrypted access token for later use (GitHub integration)
  let encryptedAccessToken: string | null = null;
  if (process.env.GITHUB_TOKEN_ENCRYPTION_KEY) {
    try {
      const { encryptToken } = await import("@/lib/github/crypto");
      encryptedAccessToken = encryptToken(accessToken);
    } catch {
      // Encryption not available — skip storing token
    }
  }

  // Fetch GitHub user profile
  const userResponse = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const githubUser: GitHubUser = await userResponse.json();

  // Fetch primary verified email if not public
  let email = githubUser.email;
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const emails: GitHubEmail[] = await emailsResponse.json();
    const primary = emails.find((e) => e.primary && e.verified);
    const verified = emails.find((e) => e.verified);
    email = primary?.email ?? verified?.email ?? null;
  }

  if (!email) {
    const response = NextResponse.redirect(`${appUrl}/?auth_error=no_email`);
    response.cookies.delete("github_oauth_state");
    return response;
  }

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { githubId: githubUser.id },
  });

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      // Link GitHub to existing account
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          githubId: githubUser.id,
          name: existingByEmail.name ?? githubUser.name ?? githubUser.login,
          avatarUrl: existingByEmail.avatarUrl ?? githubUser.avatar_url,
          ...(encryptedAccessToken && { githubAccessToken: encryptedAccessToken }),
        },
      });
    } else {
      // Create new user with role from login tab
      const chosenRole = loginRole ?? "seeker";
      user = await prisma.user.create({
        data: {
          email,
          githubId: githubUser.id,
          name: githubUser.name ?? githubUser.login,
          avatarUrl: githubUser.avatar_url,
          role: chosenRole,
          roleChosenAt: new Date(),
          ...(encryptedAccessToken && { githubAccessToken: encryptedAccessToken }),
        },
      });
    }
  } else {
    // Update profile on each login
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: githubUser.name ?? githubUser.login,
        avatarUrl: githubUser.avatar_url,
        ...(encryptedAccessToken && { githubAccessToken: encryptedAccessToken }),
      },
    });
  }

  // Issue JWT and redirect
  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role as "seeker" | "builder",
    roleChosenAt: user.roleChosenAt?.toISOString() ?? null,
  });

  // New builders without a company go to company onboarding
  const redirectUrl = user.role === "builder" && !user.companyId
    ? `${appUrl}/onboarding/company`
    : `${appUrl}/`;
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  response.cookies.delete("github_oauth_state");
  response.cookies.delete("login_role");

  return response;
}
