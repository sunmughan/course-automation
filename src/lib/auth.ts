import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { UserPayload } from "@/types";

const AUTH_SECRET = process.env.AUTH_SECRET || "default_super_secret_jwt_key_at_least_32_bytes_long_12345";
const secret = new TextEncoder().encode(AUTH_SECRET);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: UserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(token: string): Promise<UserPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as UserPayload;
}

export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

export async function getSessionUser(
  request: Request
): Promise<UserPayload | null> {
  const token = extractToken(request);
  if (token) {
    try {
      return await verifyToken(token);
    } catch {
      // fall through to proxy headers
    }
  }

  const userId = request.headers.get("x-user-id");
  const userEmail = request.headers.get("x-user-email");
  const userName = request.headers.get("x-user-name");
  const userRole = request.headers.get("x-user-role");

  if (userId && userEmail) {
    return {
      id: userId,
      email: userEmail,
      name: userName || "",
      role: (userRole as "STUDENT" | "INSTRUCTOR" | "ADMIN") || "STUDENT",
    };
  }

  return null;
}

export async function getAuthUser(
  request: Request
): Promise<UserPayload | null> {
  return getSessionUser(request);
}