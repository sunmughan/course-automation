import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL || "file:./dev.db";

  if (url.startsWith("postgresql:") || url.startsWith("postgres:")) {
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter });
  }

  const fileUrl = url.startsWith("file:") || url.startsWith("libsql:") ? url : `file:${url}`;
  const adapter = new PrismaLibSql({ url: fileUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;