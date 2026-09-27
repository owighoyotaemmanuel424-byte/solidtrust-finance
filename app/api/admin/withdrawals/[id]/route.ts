import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { getBalance, postTransaction } from "@/lib/ledger";
export const runtime = "nodejs";
function reference() { return `ST-WD-${crypto.randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase()}`; }
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || (admin.role !== "admin" && admin.role !== "compliance")) return Response.json({ error: "Admin access required." }, { status: 403 });
    const body = await request.json();
    const action = String(body.action ?? "");
    const reason = String(body.reason ?? "").trim().slice(0, 240);
    const requestRow = await prisma.withdrawalRequest.findUnique({ where: { id: params.id }, include: { account: true, user: { select: { id: true, fullName: true, email: true } } } });
    if (!requestRow) return Response.json({ error: "Withdrawal request not found." }, { status: 404 });
    if (requestRow.status !== "pending") return Response.json({ error: "Withdrawal request has already been reviewed." }, { status: 409 });

    if (action === "reject") {
      const claimed = await prisma.withdrawalRequest.updateMany({ where: { id: params.id, status: "pending" }, data: { status: "rejected", reason: reason || "Rejected by operations.", reviewedById: admin.id, reviewedAt: new Date() } });
      if (claimed.count !== 1) return Response.json({ error: "Withdrawal request has already been reviewed." }, { status: 409 });
      await prisma.auditLog.create({ data: { actorId: admin.id, action: "withdrawal.rejected", entity: "withdrawal_request", entityId: params.id, before: { status: "pending" }, after: { status: "rejected", reason: reason || "Rejected by operations." } } });
      return Response.json({ ok: true, status: "rejected" });
    }

    if (action !== "approve") return Response.json({ error: "Action must be approve or reject." }, { status: 400 });
    const claimed = await prisma.withdrawalRequest.updateMany({ where: { id: params.id, status: "pending" }, data: { status: "approved", reviewedById: admin.id, reviewedAt: new Date() } });
    if (claimed.count !== 1) return Response.json({ error: "Withdrawal request has already been reviewed." }, { status: 409 });

    try {
      const balance = new Prisma.Decimal(await getBalance(requestRow.accountId));
      if (balance.lt(requestRow.amount)) throw new Error("INSUFFICIENT_BALANCE");
      if (requestRow.account.status !== "active") throw new Error("ACCOUNT_UNAVAILABLE");
      const cash = await prisma.account.findFirst({ where: { accountNumber: "SYS:CASH", isSystem: true, status: "active", currency: requestRow.currency }, select: { id: true } });
      if (!cash) throw new Error("SYSTEM_CASH_UNAVAILABLE");
      const transaction = await postTransaction({
        reference: reference(), type: "withdrawal", description: "Approved customer withdrawal", initiatedById: admin.id,
        entries: [{ accountId: requestRow.accountId, direction: "debit", amount: requestRow.amount.toFixed(2), currency: requestRow.currency }, { accountId: cash.id, direction: "credit", amount: requestRow.amount.toFixed(2), currency: requestRow.currency }],
        metadata: { withdrawalRequestId: requestRow.id, customerId: requestRow.userId } });
      await prisma.withdrawalRequest.update({ where: { id: requestRow.id }, data: { transactionId: transaction.id } });
      await prisma.auditLog.create({ data: { actorId: admin.id, action: "withdrawal.approved", entity: "withdrawal_request", entityId: requestRow.id, after: { status: "approved", transactionId: transaction.id, amount: requestRow.amount.toFixed(2) } } });
      return Response.json({ ok: true, status: "approved", transactionId: transaction.id });
    } catch (error) {
      await prisma.withdrawalRequest.update({ where: { id: requestRow.id }, data: { status: "pending", reviewedById: null, reviewedAt: null } });
      if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") return Response.json({ error: "Customer has insufficient available balance." }, { status: 400 });
      if (error instanceof Error && error.message === "ACCOUNT_UNAVAILABLE") return Response.json({ error: "Customer account is no longer active." }, { status: 400 });
      throw error;
    }
  } catch (error) {
    console.error("Withdrawal review failed", error);
    return Response.json({ error: "Withdrawal review could not be completed." }, { status: 500 });
  }
}
