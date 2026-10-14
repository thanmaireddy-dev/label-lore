import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient singleton for Next.js.
 *
 * In development, Next.js hot-reloading would create a new PrismaClient on
 * every module refresh, quickly exhausting the database connection pool.
 * We store a single instance on the global object so it survives HMR.
 *
 * In production this module is evaluated once; the global trick is harmless.
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
