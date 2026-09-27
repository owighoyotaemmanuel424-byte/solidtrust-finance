import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Accounts() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const accounts = await prisma.account.findMany({ where: { userId: user.id, isSystem: false }, orderBy: { createdAt: "asc" } });
  return <main className="min-h-screen bg-trust-50"><div className="container py-10"><Link href="/dashboard" className="text-sm font-semibold text-trust-700">← Dashboard</Link><h1 className="mt-5 text-3xl font-bold">Your accounts</h1><div className="mt-8 grid gap-5 md:grid-cols-2">{accounts.map(a=><Link key={a.id} href={`/accounts/${a.id}`} className="rounded-3xl border border-trust-100 bg-white p-6 shadow-soft"><p className="font-semibold capitalize">{a.type} account</p><p className="mt-2 font-mono text-sm text-slate-500">{a.accountNumber}</p><p className="mt-5 text-sm capitalize text-trust-700">{a.status}</p></Link>)}</div></div></main>;
}
