import Link from "next/link";
import {ArrowRight,CheckCircle2,ShieldCheck,WalletCards,HandCoins,Globe2,ChevronRight} from "lucide-react";

const features=[
 {icon:WalletCards,title:"One clear financial home",text:"See your balance, accounts and recent activity without jumping between confusing screens."},
 {icon:HandCoins,title:"Move money simply",text:"Send and withdraw funds through straightforward flows with the important details visible before you act."},
 {icon:ShieldCheck,title:"Built around trust",text:"Clear statuses, transparent activity and security-conscious account access keep you informed."}
];

export default function Home(){
 return <main className="bg-[#f5f5f2] text-ink">
  <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f5f5f2]/90 backdrop-blur-xl">
   <div className="container flex h-20 items-center justify-between">
    <Link href="/" className="flex items-center gap-3 text-lg font-bold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#171717] text-sm text-white">S</span>SolidTrust</Link>
    <nav className="hidden items-center gap-8 text-sm font-medium text-black/60 md:flex"><a href="#products" className="transition hover:text-black">Products</a><a href="#how" className="transition hover:text-black">How it works</a><a href="#trust" className="transition hover:text-black">Trust</a></nav>
    <div className="flex items-center gap-2"><Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-black/5">Sign in</Link><Link href="/register" className="rounded-full bg-[#171717] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">Get started</Link></div>
   </div>
  </header>

  <section className="soft-grid">
   <div className="container grid min-h-[690px] items-center gap-16 py-20 lg:grid-cols-[1.05fr_.95fr]">
    <div>
     <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[.16em] text-black/55"><Globe2 className="h-4 w-4"/>Financial tools, made clearer</div>
     <h1 className="max-w-3xl text-5xl font-semibold leading-[.98] tracking-[-.045em] md:text-7xl">Your money.<br/><span className="text-black/45">One simple place.</span></h1>
     <p className="mt-7 max-w-xl text-lg leading-8 text-black/55">Save, manage and move your money with a calmer financial experience built around clarity.</p>
     <div className="mt-9 flex flex-wrap gap-3"><Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-[#171717] px-6 py-4 font-semibold text-white">Open your account <ArrowRight className="h-5 w-5"/></Link><Link href="/login" className="rounded-full border border-black/10 bg-white px-6 py-4 font-semibold">Sign in</Link></div>
     <div className="mt-9 flex flex-wrap gap-5 text-sm text-black/50"><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/>Clear balances</span><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/>Transparent activity</span><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/>Secure access</span></div>
    </div>
    <div className="relative">
     <div className="rounded-[32px] border border-black/8 bg-white p-4 shadow-card">
      <div className="rounded-[26px] bg-[#171717] p-7 text-white">
       <div className="flex items-center justify-between text-sm text-white/55"><span>Total balance</span><span>USD</span></div>
       <div className="mt-5 text-5xl font-semibold tracking-[-.04em]">$12,480.00</div>
       <div className="mt-8 flex items-end justify-between"><div><p className="text-xs text-white/45">Available to use</p><p className="mt-1 font-semibold">$12,480.00</p></div><span className="rounded-full bg-lime px-3 py-1 text-xs font-bold text-black">Active</span></div>
      </div>
      <div className="grid gap-3 p-3 pt-5 sm:grid-cols-2">
       <div className="rounded-2xl bg-[#f5f5f2] p-5"><p className="text-xs uppercase tracking-wider text-black/40">USD account</p><p className="mt-3 font-mono text-sm">30••••••4821</p><p className="mt-5 text-xl font-semibold">$12,480.00</p></div>
       <div className="rounded-2xl bg-[#f5f5f2] p-5"><p className="text-xs uppercase tracking-wider text-black/40">This month</p><p className="mt-3 text-sm text-black/50">Money in</p><p className="mt-1 text-xl font-semibold">+$680.00</p></div>
      </div>
     </div>
    </div>
   </div>
  </section>

  <section id="products" className="container py-28"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-black/40">Everything in one place</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.035em] md:text-5xl">Financial tools that stay out of your way.</h2><p className="mt-5 text-lg leading-8 text-black/50">A clean experience for the things you actually need to do with your money.</p></div><div className="mt-12 grid gap-4 md:grid-cols-3">{features.map(f=><div key={f.title} className="rounded-[26px] border border-black/8 bg-white p-7 shadow-card"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f0f0eb] text-black"><f.icon className="h-5 w-5"/></div><h3 className="mt-7 text-xl font-semibold">{f.title}</h3><p className="mt-3 leading-7 text-black/50">{f.text}</p><span className="mt-7 inline-flex items-center gap-1 text-sm font-semibold">Explore <ChevronRight className="h-4 w-4"/></span></div>)}</div></section>

  <section id="how" className="border-y border-black/5 bg-white py-28"><div className="container grid gap-16 lg:grid-cols-2"><div><p className="text-sm font-bold uppercase tracking-[.18em] text-black/40">How it works</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.035em] md:text-5xl">Know what is happening with your money.</h2></div><div className="space-y-3">{["Create your secure account","See your balance and accounts in one dashboard","Send, withdraw and track activity with clear status updates"].map((x,i)=><div key={x} className="flex items-center gap-5 rounded-2xl border border-black/8 bg-[#f8f8f5] p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#171717] text-sm font-bold text-white">0{i+1}</span><p className="font-semibold">{x}</p></div>)}</div></div></section>

  <section id="trust" className="container py-28"><div className="rounded-[32px] bg-[#171717] p-9 text-white md:p-14"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><ShieldCheck className="h-6 w-6"/></div><h2 className="mt-7 max-w-2xl text-4xl font-semibold tracking-[-.035em] md:text-5xl">Clarity is part of the product.</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-white/55">SolidTrust is designed so important balances, actions and account information are easy to understand.</p><Link href="/register" className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 font-semibold text-black">Create an account <ArrowRight className="h-5 w-5"/></Link></div></section>
  <footer className="border-t border-black/5 py-10"><div className="container flex flex-col justify-between gap-3 text-sm text-black/40 md:flex-row"><span>© 2026 SolidTrust Finance</span><span>Building Trust. Growing Wealth.</span></div></footer>
 </main>
}
