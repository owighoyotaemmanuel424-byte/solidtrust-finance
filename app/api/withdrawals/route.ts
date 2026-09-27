import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
    const body = await request.json();
    const accountId = String(body.accountId ?? "");
    const amountText = String(body.amount ?? "");
    let amount: Prisma.Decimal;
    try { amount = new Prisma.Decimal(amountText); } catch { return Response.json({ error: "Enter a valid amount." }, { status: 400 }); }
    if (!accountId || !amount.isFinite() || amount.lte(0) || amount.decimalPlaces() > 2) return Response.json({ error: "Enter a valid withdrawal amount." }, { status: 400 });
    const account = await prisma.account.findFirst({ where: { id: accountId, userId: user.id, isSystem: false, status: "active" }, select: { id: true, currency: true } });
    if (!account) return Response.json({ error: "Account is unavailable." }, { status: 400 });
    const requestRow = await prisma.withdrawalRequest.create({ data: { userId: user.id, accountId: account.id, amount, currency: account.currency } });
    await prisma.auditLog.create({ data: { actorId: user.id, action: "withdrawal.requested", entity: "withdrawal_request", entityId: requestRow.id, after: { amount: amount.toFixed(2), currency: account.currency, status: "pending" } } });
    return Response.json({ ok: true, requestId: requestRow.id });
  } catch (error) {
    console.error("Withdrawal request failed", error);
    return Response.json({ error: "Withdrawal request could not be submitted." }, { status: 500 });
  }
}
