import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAudit({ searchParams }: { searchParams: { action?: string; entity?: string; q?: string } }) {
  await requireAdmin();
  const action = searchParams.action?.trim() || "";
  const entity = searchParams.entity?.trim() || "";
  const q = searchParams.q?.trim() || "";

  const rows = await prisma.auditLog.findMany({
    where: {
      ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
      ...(entity ? { entity: { equals: entity } } : {}),
      ...(q ? { OR: [{ entityId: { contains: q, mode: "insensitive" } }, { actor: { fullName: { contains: q, mode: "insensitive" } } }, { actor: { email: { contains: q, mode: "insensitive" } } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { fullName: true, email: true, role: true } } },
  });

  return <main className="min-h-screen bg-trust-50"><div className="container py-10">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-medium text-trust-600">Compliance</p><h1 className="mt-2 text-3xl font-bold">Audit log</h1><p className="mt-2 text-slate-500">Review administrative and financial control events.</p></div><Link href="/admin" className="font-semibold text-trust-700">Admin dashboard</Link></div>
    <form className="mt-8 grid gap-3 rounded-3xl border border-trust-100 bg-white p-5 shadow-soft md:grid-cols-[1fr_180px_1fr_auto]"><input name="q" defaultValue={q} placeholder="Actor or entity ID" className="rounded-xl border p-3" /><input name="action" defaultValue={action} placeholder="Action, e.g. account.frozen" className="rounded-xl border p-3" /><select name="entity" defaultValue={entity} className="rounded-xl border p-3"><option value="">All entities</option><option value="user">User</option><option value="account">Account</option><option value="loan">Loan</option><option value="withdrawal_request">Withdrawal</option><option value="transaction">Transaction</option></select><button className="rounded-xl bg-trust-700 px-5 py-3 font-semibold text-white">Filter</button></form>
    <div className="mt-6 overflow-x-auto rounded-3xl border border-trust-100 bg-white shadow-soft"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b bg-slate-50"><tr><th className="p-4">Time</th><th className="p-4">Actor</th><th className="p-4">Action</th><th className="p-4">Entity</th><th className="p-4">Before</th><th className="p-4">After</th></tr></thead><tbody className="divide-y">{rows.map(row => <tr key={row.id} className="align-top"><td className="p-4 whitespace-nowrap">{row.createdAt.toLocaleString()}</td><td className="p-4">{row.actor ? <><div className="font-semibold">{row.actor.fullName}</div><div className="text-xs text-slate-500">{row.actor.email}</div></> : "System"}</td><td className="p-4 font-medium">{row.action}</td><td className="p-4"><div>{row.entity}</div><div className="text-xs text-slate-500 break-all">{row.entityId || "—"}</div></td><td className="max-w-xs p-4"><pre className="whitespace-pre-wrap break-words text-xs text-slate-500">{row.before ? JSON.stringify(row.before) : "—"}</pre></td><td className="max-w-xs p-4"><pre className="whitespace-pre-wrap break-words text-xs text-slate-500">{row.after ? JSON.stringify(row.after) : "—"}</pre></td></tr>)}</tbody></table>{rows.length===0&&<p className="p-6 text-slate-500">No audit events match these filters.</p>}</div>
  </div></main>;
}
