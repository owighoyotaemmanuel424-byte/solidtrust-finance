import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
const KYC = new Set(["pending", "needs_review", "verified", "rejected"]);

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentUser();
  if (!admin || (admin.role !== "admin" && admin.role !== "compliance")) return Response.json({ error: "Admin access required." }, { status: 403 });

  try {
    const form = await request.formData();
    const action = String(form.get("action") || "");
    const customer = await prisma.user.findFirst({ where: { id: params.id, role: "customer" }, select: { id: true, fullName: true, email: true, kycStatus: true } });
    if (!customer) return Response.json({ error: "Customer not found." }, { status: 404 });

    if (action === "kyc") {
      const kycStatus = String(form.get("kycStatus") || "");
      if (!KYC.has(kycStatus)) return Response.json({ error: "Invalid KYC status." }, { status: 400 });
      if (kycStatus === customer.kycStatus) return Response.redirect(new URL(`/admin/customers/${customer.id}`, request.url));
      await prisma.$transaction(async tx => {
        await tx.user.update({ where: { id: customer.id }, data: { kycStatus } });
        await tx.auditLog.create({ data: { actorId: admin.id, action: "customer.kyc_updated", entity: "user", entityId: customer.id, before: { kycStatus: customer.kycStatus }, after: { kycStatus } } });
      });
      return Response.redirect(new URL(`/admin/customers/${customer.id}`, request.url));
    }

    if (action === "freeze-account" || action === "unfreeze-account") {
      const accountId = String(form.get("accountId") || "");
      const nextStatus = action === "freeze-account" ? "frozen" : "active";
      const account = await prisma.account.findFirst({ where: { id: accountId, userId: customer.id, isSystem: false }, select: { id: true, accountNumber: true, status: true } });
      if (!account) return Response.json({ error: "Customer account not found." }, { status: 404 });
      if (account.status === "closed") return Response.json({ error: "Closed accounts cannot be reopened here." }, { status: 400 });
      if (account.status === nextStatus) return Response.redirect(new URL(`/admin/customers/${customer.id}`, request.url));

      await prisma.$transaction(async tx => {
        await tx.account.update({ where: { id: account.id }, data: { status: nextStatus } });
        await tx.auditLog.create({ data: { actorId: admin.id, action: nextStatus === "frozen" ? "account.frozen" : "account.unfrozen", entity: "account", entityId: account.id, before: { status: account.status }, after: { status: nextStatus, accountNumber: account.accountNumber, customerId: customer.id } } });
      });
      return Response.redirect(new URL(`/admin/customers/${customer.id}`, request.url));
    }

    return Response.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    console.error("Customer admin action failed", error);
    return Response.json({ error: "Customer update could not be completed." }, { status: 500 });
  }
}
