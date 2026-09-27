import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const directUrl = process.env.DIRECT_URL?.trim();

  if (!databaseUrl && !directUrl) {
    throw new Error("DATABASE_URL or DIRECT_URL is not configured");
  }

  // The Vercel project may contain a Prisma Accelerate URL in DATABASE_URL.
  // This app uses the normal Prisma PostgreSQL client, so always prefer the
  // direct PostgreSQL URL when one is available.
  const url =
    directUrl && !directUrl.startsWith("prisma://") && !directUrl.startsWith("prisma+postgres://")
      ? directUrl
      : databaseUrl;

  if (!url || url.startsWith("prisma://") || url.startsWith("prisma+postgres://")) {
    throw new Error(
      "A direct PostgreSQL connection string is required. Set DIRECT_URL to the Neon PostgreSQL URL.",
    );
  }

  return new PrismaClient({
    datasources: {
      db: { url },
    },
    log: ["error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
