import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";
import { apiHandler } from "@/lib/api-handler";
import { authSchemas, UnauthorizedError } from "@/lib/errors";

export const POST = apiHandler(async (ctx) => {
  const { email, password } = (ctx as any).body as {
    email: string;
    password: string;
  };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const token = await createToken(payload);

  const response = NextResponse.json({ token, user: payload });
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}, { bodySchema: authSchemas.login });