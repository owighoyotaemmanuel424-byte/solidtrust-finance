import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const accounts = await prisma.account.findMany({ where: { userId: user.id, isSystem: false }, orderBy: { createdAt: "asc" }, select: { id: true, accountNumber: true, type: true, currency: true, status: true } });
  return Response.json({ accounts });
}
