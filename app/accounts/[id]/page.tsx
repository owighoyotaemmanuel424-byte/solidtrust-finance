import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const account = await prisma.account.findFirst({ where: { id: params.id, userId: user.id, isSystem: false }, include: { ledgerEntries: { orderBy: { createdAt: "desc" }, take: 20, include: { transaction: true } } } });
  if (!account) notFound();
  const balance = account.ledgerEntries.reduce((sum,e)=>sum+(e.direction==="credit"?Number(e.amount):-Number(e.amount)),0);
  return <main className="min-h-screen bg-trust-50"><div className="container py-10"><Link href="/accounts" className="text-sm font-semibold text-trust-700">← Accounts</Link><div className="mt-5 rounded-3xl bg-trust-800 p-7 text-white"><p className="text-sm text-trust-200 capitalize">{account.type} account</p><p className="mt-2 text-4xl font-bold">{balance.toLocaleString("en-US",{style:"currency",currency:account.currency})}</p><p className="mt-3 font-mono text-sm text-trust-200">{account.accountNumber}</p></div><section className="mt-8 rounded-3xl border border-trust-100 bg-white p-6"><h2 className="text-xl font-bold">Account activity</h2>{account.ledgerEntries.length===0?<p className="mt-5 text-slate-500">No account activity yet.</p>:<div className="mt-4 divide-y">{account.ledgerEntries.map(e=><div key={e.id} className="flex justify-between gap-4 py-4"><div><p className="font-semibold capitalize">{e.transaction.type.replaceAll("_"," ")}</p><p className="text-sm text-slate-500">{e.transaction.description||e.transaction.reference}</p></div><p className="font-semibold">{e.direction==="credit"?"+":"−"}{Number(e.amount).toLocaleString("en-US",{style:"currency",currency:e.currency})}</p></div>)}</div>}</section></div></main>;
}
