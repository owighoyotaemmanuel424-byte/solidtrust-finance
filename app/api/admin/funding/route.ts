import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { postTransaction } from "@/lib/ledger";
export const runtime = "nodejs";
function reference() { return `ST-FUND-${crypto.randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase()}`; }
export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || (admin.role !== "admin" && admin.role !== "compliance")) return Response.json({ error: "Admin access required." }, { status: 403 });
    const body = await request.json();
    const accountId = String(body.accountId ?? "");
    const amountText = String(body.amount ?? "");
    const description = String(body.description ?? "").trim().slice(0, 140);
    let amount: Prisma.Decimal;
    try { amount = new Prisma.Decimal(amountText); } catch { return Response.json({ error: "Enter a valid amount." }, { status: 400 }); }
    if (!accountId || !amount.isFinite() || amount.lte(0) || amount.decimalPlaces() > 2) return Response.json({ error: "Enter a valid funding amount." }, { status: 400 });
    const account = await prisma.account.findFirst({ where: { id: accountId, isSystem: false, status: "active" }, select: { id: true, currency: true, userId: true } });
    if (!account?.userId) return Response.json({ error: "Customer account is unavailable." }, { status: 400 });
    const cash = await prisma.account.findFirst({ where: { accountNumber: "SYS:CASH", isSystem: true, status: "active", currency: account.currency }, select: { id: true } });
    if (!cash) return Response.json({ error: "System cash account is not configured." }, { status: 500 });
    const transaction = await postTransaction({ reference: reference(), type: "deposit", description: description || "Admin account funding", initiatedById: admin.id,
      entries: [{ accountId: cash.id, direction: "debit", amount: amount.toFixed(2), currency: account.currency }, { accountId: account.id, direction: "credit", amount: amount.toFixed(2), currency: account.currency }],
      metadata: { adminFunding: true, customerAccountId: account.id } });
    await prisma.auditLog.create({ data: { actorId: admin.id, action: "account.funded", entity: "account", entityId: account.id, after: { transactionId: transaction.id, amount: amount.toFixed(2), currency: account.currency } } });
    return Response.json({ ok: true, transaction });
  } catch (error) {
    console.error("Admin funding failed", error);
    return Response.json({ error: "Funding could not be completed." }, { status: 500 });
  }
}
