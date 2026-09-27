"use client";

import AppSidebar from "@/components/app-sidebar";
import { useEffect, useState } from "react";

export default function WithdrawForm() {
  const [accounts,setAccounts]=useState<{id:string;accountNumber:string;currency:string}[]>([]);
  const [accountId,setAccountId]=useState("");
  const [amount,setAmount]=useState("");
  const [message,setMessage]=useState("");

  useEffect(()=>{fetch("/api/accounts").then(r=>r.json()).then(d=>setAccounts(d.accounts??[])).catch(()=>setMessage("Could not load accounts."));},[]);

  async function submit(e:React.FormEvent){
    e.preventDefault(); setMessage("");
    const r=await fetch("/api/withdrawals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accountId,amount})});
    const d=await r.json();
    setMessage(r.ok?"Withdrawal request submitted for review.":(d.error||"Request failed."));
    if(r.ok)setAmount("");
  }

  return <div className="min-h-screen md:pl-[248px]"><AppSidebar/><main className="min-h-screen bg-[#f5f5f2]"><div className="container py-12 pt-24 md:pt-12"><div className="max-w-xl rounded-3xl border border-trust-100 bg-white p-8 shadow-soft"><p className="text-sm font-medium text-trust-600">SolidTrust Finance</p><h1 className="mt-2 text-3xl font-bold text-ink">Request a withdrawal</h1><p className="mt-2 text-slate-500">Withdrawals are reviewed before any balance movement occurs.</p><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-medium">Account<select value={accountId} onChange={e=>setAccountId(e.target.value)} required className="mt-2 w-full rounded-xl border p-3"><option value="">Select account</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.accountNumber} · {a.currency}</option>)}</select></label><label className="block text-sm font-medium">Amount<input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" required placeholder="0.00" className="mt-2 w-full rounded-xl border p-3"/></label><button className="w-full rounded-xl bg-trust-700 px-4 py-3 font-semibold text-white">Submit withdrawal request</button></form>{message&&<p className="mt-5 text-sm text-slate-600">{message}</p>}</div></div></main></div>;
}
