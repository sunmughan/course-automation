import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const token =
      request.cookies.get("auth_token")?.value ||
      request.headers.get("Authorization")?.replace("Bearer ", "");

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
        const { payload } = await jwtVerify(token, secret);

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-id", payload.id as string);
        requestHeaders.set("x-user-email", payload.email as string);
        requestHeaders.set("x-user-name", payload.name as string);
        requestHeaders.set("x-user-role", payload.role as string);

        return NextResponse.next({ request: { headers: requestHeaders } });
      } catch {
        // Invalid token, continue without auth headers
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};