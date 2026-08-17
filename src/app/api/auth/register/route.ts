import { sendWelcomeEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";
import { apiHandler } from "@/lib/api-handler";
import { authSchemas, ConflictError } from "@/lib/errors";

export const POST = apiHandler(async (ctx) => {
  const { name, email, password } = (ctx as any).body as {
    name: string;
    email: string;
    password: string;
  };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError("Email already in use");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const token = await createToken(payload);
  sendWelcomeEmail(user.email, user.name || "Student").catch(() => {});

  const response = NextResponse.json({ token, user: payload }, { status: 201 });
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}, { bodySchema: authSchemas.register });