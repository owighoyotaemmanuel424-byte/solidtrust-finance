import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const configuredUrl = process.env.DATABASE_URL?.trim();
  const directUrl = process.env.DIRECT_URL?.trim();

  if (!configuredUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  // Prisma Accelerate/Data Proxy URLs use the prisma:// protocol and are
  // not valid connection strings for PrismaNeon. When a direct Neon URL is
  // available, prefer it for this Node.js runtime.
  const connectionString =
    configuredUrl.startsWith("prisma://") ||
    configuredUrl.startsWith("prisma+postgres://")
      ? directUrl || configuredUrl
      : configuredUrl;

  if (
    connectionString.startsWith("prisma://") ||
    connectionString.startsWith("prisma+postgres://")
  ) {
    throw new Error(
      "DATABASE_URL is a Prisma Accelerate URL. Set DIRECT_URL to the direct Neon PostgreSQL connection string.",
    );
  }

  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({ adapter, log: ["error", "warn"] });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
