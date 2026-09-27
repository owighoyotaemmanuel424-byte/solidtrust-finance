import AppSidebar from "@/components/app-sidebar";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { ArrowDownToLine, ArrowUpRight, CreditCard, LogOut, UserRound, Wallet } from "lucide-react";

export const dynamic="force-dynamic";
function money(value:unknown){return Number(value??0).toLocaleString("en-US",{style:"currency",currency:"USD"});}
export default async function Dashboard(){
 const user=await getCurrentUser(); if(!user)redirect("/login");
 const accounts=await prisma.account.findMany({where:{userId:user.id,isSystem:false},orderBy:{createdAt:"asc"}});
 const ids=accounts.map(a=>a.id);
 const entries=ids.length?await prisma.ledgerEntry.findMany({where:{accountId:{in:ids}},select:{direction:true,amount:true}}):[];
 const balance=entries.reduce((sum,e)=>sum+(e.direction==="credit"?Number(e.amount):-Number(e.amount)),0);
 const recent=ids.length?await prisma.transaction.findMany({where:{ledgerEntries:{some:{accountId:{in:ids}}}},orderBy:{createdAt:"desc"},take:6,select:{id:true,reference:true,type:true,status:true,amount:true,currency:true,description:true,createdAt:true}}):[];
 return <div className="min-h-screen md:pl-[248px] transition-[padding]"><AppSidebar/><main className="app-shell">
    <div className="container py-10">
   <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-medium text-black/40">Good to see you</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.03em]">Hi, {user.fullName.split(" ")[0]}</h1></div><Link href="/profile" className="text-sm font-semibold text-black/60 hover:text-black">Account settings →</Link></div>
   <section className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
    <div className="rounded-[28px] bg-[#171717] p-7 text-white shadow-card md:p-9"><div className="flex items-center justify-between"><p className="text-sm text-white/50">Total balance</p><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">USD</span></div><p className="mt-4 text-5xl font-semibold tracking-[-.045em]">{money(balance)}</p><p className="mt-3 text-sm text-white/45">Across {accounts.length} account{accounts.length===1?"":"s"}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/transfer" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"><ArrowUpRight className="h-4 w-4"/>Send money</Link><Link href="/withdraw" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white"><ArrowDownToLine className="h-4 w-4"/>Withdraw</Link></div></div>
    <div className="rounded-[28px] border border-black/8 bg-white p-7 shadow-card"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f0f0eb]"><CreditCard className="h-5 w-5"/></div><div><p className="font-semibold">Your accounts</p><p className="text-xs text-black/40">{accounts.length} active</p></div></div><div className="mt-6 space-y-3">{accounts.slice(0,3).map(a=><Link key={a.id} href={"/accounts/"+a.id} className="block rounded-2xl bg-[#f7f7f4] p-4 hover:bg-[#eeeeea]"><div className="flex justify-between gap-3"><span className="text-sm font-semibold capitalize">{a.type} account</span><span className="text-xs text-black/40">{a.currency}</span></div><p className="mt-2 font-mono text-xs text-black/40">{a.accountNumber}</p></Link>)}</div><Link href="/accounts" className="mt-5 block text-sm font-semibold">View all accounts →</Link></div>
   </section>
   <section className="mt-8 rounded-[28px] border border-black/8 bg-white shadow-card"><div className="flex items-center justify-between border-b border-black/5 p-6"><div><h2 className="font-semibold">Recent activity</h2><p className="mt-1 text-sm text-black/40">Your latest financial activity</p></div><Link href="/transactions" className="text-sm font-semibold">View all</Link></div>{recent.length===0?<p className="p-6 text-sm text-black/45">No transactions yet.</p>:<div className="divide-y divide-black/5">{recent.map(tx=><div key={tx.id} className="flex items-center justify-between gap-4 p-5"><div className="min-w-0"><p className="font-medium capitalize">{tx.type.replaceAll("_"," ")}</p><p className="mt-1 truncate text-sm text-black/40">{tx.description||tx.reference}</p></div><div className="text-right"><p className="font-semibold">{money(tx.amount)}</p><p className="mt-1 text-xs capitalize text-black/40">{tx.status}</p></div></div>)}</div>}</section>
  </div>
 </main></div>
}