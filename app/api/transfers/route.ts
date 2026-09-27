import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { getBalance, postTransaction } from "@/lib/ledger";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function reference() {
  return `ST-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
    const body = await request.json();
    const fromAccountId = String(body.fromAccountId ?? "");
    const toAccountNumber = String(body.toAccountNumber ?? "").trim();
    const description = String(body.description ?? "").trim().slice(0, 140);
    const amountText = String(body.amount ?? "");
    let amount: Prisma.Decimal;
    try { amount = new Prisma.Decimal(amountText); } catch { return Response.json({ error: "Enter a valid amount." }, { status: 400 }); }
    if (!fromAccountId || !toAccountNumber || !amount.isFinite() || amount.lte(0)) return Response.json({ error: "Enter a valid recipient and amount." }, { status: 400 });
    if (amount.decimalPlaces() > 2) return Response.json({ error: "Amount can have at most two decimal places." }, { status: 400 });

    const source = await prisma.account.findFirst({ where: { id: fromAccountId, userId: user.id, isSystem: false, status: "active" }, select: { id: true, accountNumber: true, currency: true } });
    if (!source) return Response.json({ error: "Source account is unavailable." }, { status: 400 });
    const destination = await prisma.account.findFirst({ where: { accountNumber: toAccountNumber, isSystem: false, status: "active" }, select: { id: true, userId: true, currency: true } });
    if (!destination || !destination.userId || destination.id === source.id) return Response.json({ error: "Recipient account was not found." }, { status: 404 });
    if (destination.currency !== source.currency) return Response.json({ error: "Accounts must use the same currency." }, { status: 400 });

    const balance = new Prisma.Decimal(await getBalance(source.id));
    if (balance.lt(amount)) return Response.json({ error: "Insufficient available balance." }, { status: 400 });

    const transaction = await postTransaction({
      reference: reference(),
      type: "transfer",
      amount: amount.toFixed(2),
      currency: source.currency,
      description: description || "Account transfer",
      initiatedById: user.id,
      entries: [
        { accountId: source.id, direction: "debit", amount: amount.toFixed(2), currency: source.currency },
        { accountId: destination.id, direction: "credit", amount: amount.toFixed(2), currency: destination.currency },
      ],
      metadata: { recipientAccountId: destination.id },
    });
    return Response.json({ ok: true, transaction });
  } catch (error) {
    console.error("Transfer failed", error);
    return Response.json({ error: "Transfer could not be completed." }, { status: 500 });
  }
}
