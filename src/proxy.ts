import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Optimistic auth check — reads the JWT cookie without hitting the DB.
 * Redirects authenticated users away from public-only routes and
 * unauthenticated users away from protected routes. This prevents the
 * flash of wrong content before React hydrates.
 */
export async function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, secret);
      isAuthenticated = true;
    } catch {
      // Invalid/expired token — treat as unauthenticated
    }
  }

  const { pathname } = req.nextUrl;

  // Protected routes: redirect to / with login modal if not authenticated
  const protectedRoutes = ["/settings"];
  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("login", "1");
    return NextResponse.redirect(url);
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
