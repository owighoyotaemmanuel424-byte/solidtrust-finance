import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function money(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const accounts = await prisma.account.findMany({
    where: { userId: user.id, isSystem: false },
    include: { ledgerEntries: { select: { direction: true, amount: true } } },
    orderBy: { createdAt: "asc" },
  });

  const accountIds = accounts.map((a) => a.id);
  const entries = accountIds.length ? await prisma.ledgerEntry.findMany({
    where: { accountId: { in: accountIds } },
    select: { direction: true, amount: true },
  }) : [];

  const balance = entries.reduce((sum, entry) => sum + (entry.direction === "credit" ? Number(entry.amount) : -Number(entry.amount)), 0);
  const recent = accountIds.length ? await prisma.transaction.findMany({
    where: { ledgerEntries: { some: { accountId: { in: accountIds } } } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, reference: true, type: true, status: true, amount: true, currency: true, description: true, createdAt: true },
  }) : [];

  return <main className="min-h-screen bg-trust-50"><header className="border-b border-trust-100 bg-white"><div className="container flex h-16 items-center justify-between"><Link href="/" className="font-bold text-trust-800">SolidTrust</Link><nav className="flex items-center gap-4 text-sm"><Link href="/accounts" className="text-slate-600">Accounts</Link><Link href="/transactions" className="text-slate-600">Transactions</Link><Link href="/profile" className="text-slate-600">Profile</Link></nav></div></header><div className="container py-10"><p className="text-sm font-medium text-trust-600">Customer dashboard</p><h1 className="mt-2 text-3xl font-bold text-ink">Welcome, {user.fullName}</h1><div className="mt-8 rounded-3xl bg-trust-800 p-7 text-white shadow-soft"><p className="text-sm text-trust-200">Total balance</p><p className="mt-2 text-4xl font-bold">{money(balance)}</p><p className="mt-2 text-sm text-trust-200">{accounts.length} account{accounts.length === 1 ? "" : "s"} · USD</p></div><section className="mt-8 grid gap-5 md:grid-cols-2">{accounts.map((account)=><Link key={account.id} href={`/accounts/${account.id}`} className="rounded-3xl border border-trust-100 bg-white p-6 shadow-soft"><div className="flex items-center justify-between"><span className="font-semibold capitalize">{account.type} account</span><span className="rounded-full bg-trust-50 px-3 py-1 text-xs font-semibold capitalize text-trust-700">{account.status}</span></div><p className="mt-4 font-mono text-sm text-slate-500">{account.accountNumber}</p></Link>)}</section><section className="mt-8 rounded-3xl border border-trust-100 bg-white p-6 shadow-soft"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Recent activity</h2><Link href="/transactions" className="text-sm font-semibold text-trust-700">View all</Link></div>{recent.length === 0 ? <p className="mt-6 text-slate-500">No transactions yet.</p> : <div className="mt-5 divide-y">{recent.map((tx)=><div key={tx.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-semibold capitalize">{tx.type.replaceAll("_"," ")}</p><p className="text-sm text-slate-500">{tx.description || tx.reference}</p></div><div className="text-right"><p className="font-semibold">{money(tx.amount)}</p><p className="text-xs capitalize text-slate-500">{tx.status}</p></div></div>)}</div>}</section></div></main>;
}
