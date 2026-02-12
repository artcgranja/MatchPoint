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

  // Read state cookie for CSRF validation
  const cookieStore = await cookies();
  const storedState = cookieStore.get("github_oauth_state")?.value ?? null;

  if (!code || !state || !storedState || state !== storedState) {
    const response = NextResponse.redirect(`${appUrl}/login?error=invalid_state`);
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
    const response = NextResponse.redirect(`${appUrl}/login?error=token_exchange`);
    response.cookies.delete("github_oauth_state");
    return response;
  }

  const accessToken = tokenData.access_token as string;

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
    const response = NextResponse.redirect(`${appUrl}/login?error=no_email`);
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
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          githubId: githubUser.id,
          name: githubUser.name ?? githubUser.login,
          avatarUrl: githubUser.avatar_url,
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
      },
    });
  }

  // Issue JWT and redirect to home
  const token = await signToken({ userId: user.id, email: user.email });

  const response = NextResponse.redirect(`${appUrl}/`);

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  response.cookies.delete("github_oauth_state");

  return response;
}
