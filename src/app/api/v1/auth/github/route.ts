import { cookies } from "next/headers";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(32).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set("github_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/auth/github/callback`,
    scope: "read:user user:email",
    state,
  });

  return Response.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
}
