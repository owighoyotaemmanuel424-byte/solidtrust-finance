import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const KYC = ["pending", "verified", "rejected", "needs_review"] as const;

export async function GET(request: Request) {
  const admin = await getCurrentUser();
  if (!admin || (admin.role !== "admin" && admin.role !== "compliance")) {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const kyc = url.searchParams.get("kyc") || "";
  const status = url.searchParams.get("status") || "";

  const customers = await prisma.user.findMany({
    where: {
      role: "customer",
      ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q, mode: "insensitive" } }] } : {}),
      ...(KYC.includes(kyc as (typeof KYC)[number]) ? { kycStatus: kyc } : {}),
      ...(status === "frozen" || status === "active" || status === "closed"
        ? { accounts: { some: { status } } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, fullName: true, email: true, phone: true, kycStatus: true, createdAt: true,
      accounts: { where: { isSystem: false }, select: { id: true, accountNumber: true, status: true, currency: true, type: true } },
      _count: { select: { loans: true, withdrawalRequests: true, auditLogs: true } },
    },
  });

  return Response.json({ customers });
}
