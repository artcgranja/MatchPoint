import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  role: "seeker" | "builder";
  roleChosenAt?: string | null;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getUserIdOrThrow(): Promise<string> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  return user.userId;
}

export function generateMagicLinkToken(): string {
  return randomBytes(32).toString("base64url");
}
