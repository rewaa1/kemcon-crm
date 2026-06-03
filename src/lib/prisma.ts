import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    // DATABASE_URL must point at Supabase's transaction-mode pooler (port 6543)
    // in production. On serverless each instance keeps its own pool, so cap it
    // at 1 connection per instance and let the pooler do the multiplexing.
    // Locally a slightly larger pool is fine for hot-reload concurrency.
    max: process.env.NODE_ENV === "production" ? 1 : 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
