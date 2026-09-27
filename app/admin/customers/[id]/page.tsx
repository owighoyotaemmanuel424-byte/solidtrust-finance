import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getBalance } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetail({ params }: { params: { id: string } }) {
  await requireAdmin();
  const customer = await prisma.user.findFirst({
    where: { id: params.id, role: "customer" },
    include: {
      accounts: { where: { isSystem: false }, orderBy: { createdAt: "asc" } },
      loans: { orderBy: { createdAt: "desc" }, take: 10 },
      withdrawalRequests: { orderBy: { createdAt: "desc" }, take: 10, include: { account: { select: { accountNumber: true } } } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 10, include: { actor: { select: { fullName: true, email: true } } } },
    },
  });
  if (!customer) notFound();

  const balances = await Promise.all(customer.accounts.map(async account => ({ id: account.id, balance: await getBalance(account.id) })));
  const balanceMap = new Map(balances.map(x => [x.id, x.balance]));

  return <main className="min-h-screen bg-trust-50"><div className="container py-10">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-medium text-trust-600">Customer profile</p><h1 className="mt-2 text-3xl font-bold">{customer.fullName}</h1><p className="mt-2 text-slate-500">{customer.email}{customer.phone ? ` · ${customer.phone}` : ""}</p></div><Link href="/admin/customers" className="font-semibold text-trust-700">All customers</Link></div>

    <section className="mt-8 grid gap-5 md:grid-cols-3"><div className="rounded-2xl bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">KYC status</p><p className="mt-2 text-xl font-bold capitalize">{customer.kycStatus.replaceAll("_", " ")}</p></div><div className="rounded-2xl bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">Joined</p><p className="mt-2 font-semibold">{customer.createdAt.toLocaleString()}</p></div><div className="rounded-2xl bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">MFA</p><p className="mt-2 font-semibold">{customer.mfaEnabled ? "Enabled" : "Not enabled"}</p></div></section>

    <section className="mt-6 rounded-3xl border border-trust-100 bg-white p-6 shadow-soft"><h2 className="text-xl font-bold">KYC & account controls</h2><div className="mt-5 grid gap-4 md:grid-cols-2">
      <form action={`/api/admin/customers/${customer.id}`} method="post" className="flex gap-3"><input type="hidden" name="action" value="kyc" /><select name="kycStatus" defaultValue={customer.kycStatus} className="flex-1 rounded-xl border p-3"><option value="pending">Pending</option><option value="needs_review">Needs review</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select><button className="rounded-xl bg-trust-700 px-4 font-semibold text-white">Update KYC</button></form>
      <div className="text-sm text-slate-500">Account freezes stop balance-changing customer operations while preserving the ledger history.</div>
    </div></section>

    <section className="mt-6 rounded-3xl border border-trust-100 bg-white p-6 shadow-soft"><h2 className="text-xl font-bold">Accounts</h2><div className="mt-4 space-y-3">{customer.accounts.map(account => <div key={account.id} className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold">{account.accountNumber}</p><p className="text-sm text-slate-500 capitalize">{account.type} · {account.currency} · {account.status}</p><p className="mt-1 text-lg font-bold">{Number(balanceMap.get(account.id) || "0").toLocaleString("en-US",{style:"currency",currency:account.currency})}</p></div><div className="flex gap-2">{account.status === "active" ? <form action={`/api/admin/customers/${customer.id}`} method="post"><input type="hidden" name="action" value="freeze-account" /><input type="hidden" name="accountId" value={account.id} /><button className="rounded-xl border border-amber-300 px-4 py-2 font-semibold text-amber-800">Freeze</button></form> : account.status === "frozen" ? <form action={`/api/admin/customers/${customer.id}`} method="post"><input type="hidden" name="action" value="unfreeze-account" /><input type="hidden" name="accountId" value={account.id} /><button className="rounded-xl bg-trust-700 px-4 py-2 font-semibold text-white">Unfreeze</button></form> : null}</div></div>)}</div></section>

    <section className="mt-6 grid gap-6 lg:grid-cols-2"><div className="rounded-3xl border border-trust-100 bg-white p-6 shadow-soft"><h2 className="text-xl font-bold">Recent loans</h2><div className="mt-4 space-y-3">{customer.loans.length ? customer.loans.map(loan => <div key={loan.id} className="rounded-xl border p-4"><div className="flex justify-between"><span className="font-semibold capitalize">{loan.status.replaceAll("_"," ")}</span><span>{Number(loan.principal).toLocaleString("en-US",{style:"currency",currency:"USD"})}</span></div><p className="mt-1 text-sm text-slate-500">{loan.termMonths} months · {(Number(loan.interestRate)*100).toFixed(2)}%</p></div>) : <p className="text-slate-500">No loans.</p>}</div></div>
      <div className="rounded-3xl border border-trust-100 bg-white p-6 shadow-soft"><h2 className="text-xl font-bold">Recent withdrawals</h2><div className="mt-4 space-y-3">{customer.withdrawalRequests.length ? customer.withdrawalRequests.map(row => <div key={row.id} className="rounded-xl border p-4"><div className="flex justify-between"><span className="font-semibold capitalize">{row.status}</span><span>{Number(row.amount).toLocaleString("en-US",{style:"currency",currency:row.currency})}</span></div><p className="mt-1 text-sm text-slate-500">{row.account.accountNumber} · {row.createdAt.toLocaleString()}</p></div>) : <p className="text-slate-500">No withdrawals.</p>}</div></div>
    </section>
  </div></main>;
}
