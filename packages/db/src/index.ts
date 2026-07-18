import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton: without this, hot-reload would create
// a fresh PrismaClient (and a fresh connection pool) on every file save.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
