import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

interface ProxyJWTPayload {
  userId: string;
  role: "seeker" | "builder";
  roleChosenAt?: string | null;
}

/**
 * Optimistic auth check — reads the JWT cookie without hitting the DB.
 * Handles role selection redirect, route protection, and role-based access.
 */
export async function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  let isAuthenticated = false;
  let payload: ProxyJWTPayload | null = null;

  if (token) {
    try {
      const result = await jwtVerify(token, secret);
      isAuthenticated = true;
      payload = result.payload as unknown as ProxyJWTPayload;
    } catch {
      // Invalid/expired token — treat as unauthenticated
    }
  }

  const { pathname } = req.nextUrl;

  // Protected routes: redirect to / with login modal if not authenticated
  const protectedRoutes = ["/settings", "/onboarding", "/company"];
  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("login", "1");
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && payload) {
    const isRoleSelectPage = pathname === "/onboarding";
    const isOnboardingCompany = pathname.startsWith("/onboarding/company");

    // 1. No roleChosenAt + NOT on role selection → redirect to /onboarding
    if (!payload.roleChosenAt && !isRoleSelectPage) {
      const url = req.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // 2. roleChosenAt set + on role selection page → redirect to /
    if (payload.roleChosenAt && isRoleSelectPage) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // 3. Only builders can access /onboarding/company, seekers redirect away
    if (isOnboardingCompany && payload.role !== "builder") {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // 4. Role-based route protection
    const isBuilder = payload.role === "builder";
    const seekerOnlyRoutes = ["/descubra", "/salvos", "/searches"];
    const builderOnlyRoutes = ["/company"];

    if (isBuilder && seekerOnlyRoutes.some((r) => pathname.startsWith(r))) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    if (!isBuilder && builderOnlyRoutes.some((r) => pathname.startsWith(r))) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next (static files, images)
     * - static assets (favicon, images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
