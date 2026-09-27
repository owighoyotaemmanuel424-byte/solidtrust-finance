import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCustomers({ searchParams }: { searchParams: { q?: string; kyc?: string; status?: string } }) {
  await requireAdmin();
  const q = searchParams.q?.trim() || "";
  const kyc = searchParams.kyc || "";
  const status = searchParams.status || "";

  const customers = await prisma.user.findMany({
    where: {
      role: "customer",
      ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q, mode: "insensitive" } }] } : {}),
      ...(kyc ? { kycStatus: kyc } : {}),
      ...(status === "frozen" || status === "active" || status === "closed" ? { accounts: { some: { status } } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      accounts: { where: { isSystem: false }, select: { id: true, accountNumber: true, status: true, currency: true, type: true } },
      _count: { select: { loans: true, withdrawalRequests: true } },
    },
  });

  return <main className="min-h-screen bg-trust-50"><div className="container py-10">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-medium text-trust-600">Operations</p><h1 className="mt-2 text-3xl font-bold">Customer management</h1><p className="mt-2 text-slate-500">Search customers, review KYC status, and manage account access.</p></div><Link href="/admin" className="font-semibold text-trust-700">Admin dashboard</Link></div>

    <form className="mt-8 grid gap-3 rounded-3xl border border-trust-100 bg-white p-5 shadow-soft md:grid-cols-[1fr_180px_180px_auto]">
      <input name="q" defaultValue={q} placeholder="Name, email, or phone" className="rounded-xl border p-3" />
      <select name="kyc" defaultValue={kyc} className="rounded-xl border p-3"><option value="">All KYC</option><option value="pending">Pending</option><option value="needs_review">Needs review</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select>
      <select name="status" defaultValue={status} className="rounded-xl border p-3"><option value="">Any account status</option><option value="active">Active</option><option value="frozen">Frozen</option><option value="closed">Closed</option></select>
      <button className="rounded-xl bg-trust-700 px-5 py-3 font-semibold text-white">Search</button>
    </form>

    <section className="mt-6 space-y-4">{customers.length === 0 ? <div className="rounded-2xl bg-white p-6 text-slate-500">No customers match these filters.</div> : customers.map(customer =>
      <Link key={customer.id} href={`/admin/customers/${customer.id}`} className="block rounded-2xl border border-trust-100 bg-white p-5 shadow-soft hover:border-trust-300">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><p className="font-semibold">{customer.fullName}</p><p className="text-sm text-slate-500">{customer.email}{customer.phone ? ` · ${customer.phone}` : ""}</p></div>
          <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-slate-100 px-3 py-1 capitalize">{customer.kycStatus.replaceAll("_", " ")}</span>{customer.accounts.map(a => <span key={a.id} className={`rounded-full px-3 py-1 ${a.status === "frozen" ? "bg-amber-100 text-amber-800" : "bg-trust-50 text-trust-800"}`}>{a.accountNumber} · {a.status}</span>)}</div>
        </div>
        <div className="mt-4 flex gap-5 text-sm text-slate-500"><span>{customer.accounts.length} account(s)</span><span>{customer._count.loans} loan(s)</span><span>{customer._count.withdrawalRequests} withdrawal(s)</span></div>
      </Link>
    )}</section>
  </div></main>;
}
