import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const admin = await requireAdmin();

  const [customers, accounts, pendingLoans, recentTransactions] = await Promise.all([
    prisma.user.count({ where: { role: "customer" } }),
    prisma.account.count({ where: { isSystem: false } }),
    prisma.loan.count({ where: { status: { in: ["applied", "under_review"] } } }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        reference: true,
        type: true,
        status: true,
        amount: true,
        currency: true,
        createdAt: true,
        initiatedBy: { select: { fullName: true, email: true } },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-trust-50">
      <header className="border-b border-trust-100 bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="font-bold text-trust-800">SolidTrust Admin</Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">{admin.fullName}</span>
            <Link href="/dashboard" className="font-semibold text-trust-700">Customer view</Link>
          </div>
        </div>
      </header>

      <div className="container py-10">
        <p className="text-sm font-medium text-trust-600">Operations</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Admin dashboard</h1>
        <p className="mt-2 text-slate-500">Monitor customers, accounts, lending activity, and ledger movements.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/admin/funding" className="rounded-xl bg-trust-700 px-4 py-2 text-sm font-semibold text-white">Fund customer</Link><Link href="/admin/loans" className="rounded-xl border border-trust-200 bg-white px-4 py-2 text-sm font-semibold text-trust-700">Review loans</Link><Link href="/admin/withdrawals" className="rounded-xl border border-trust-200 bg-white px-4 py-2 text-sm font-semibold text-trust-700">Review withdrawals</Link></div>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Customers", customers],
            ["Customer accounts", accounts],
            ["Pending loans", pendingLoans],
            ["Recent transactions", recentTransactions.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-3xl border border-trust-100 bg-white p-6 shadow-soft">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-trust-100 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent ledger activity</h2>
            <Link href="/transactions" className="text-sm font-semibold text-trust-700">Transactions</Link>
          </div>
          <div className="mt-5 divide-y">
            {recentTransactions.length === 0 ? (
              <p className="py-4 text-slate-500">No transactions recorded yet.</p>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold capitalize">{tx.type.replaceAll("_", " ")}</p>
                    <p className="text-sm text-slate-500">
                      {tx.initiatedBy?.fullName || "System"} · {tx.reference}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-semibold">
                      {Number(tx.amount).toLocaleString("en-US", { style: "currency", currency: tx.currency })}
                    </p>
                    <p className="text-xs capitalize text-slate-500">{tx.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
