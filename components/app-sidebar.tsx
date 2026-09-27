"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Home,
  LogOut,
  Menu,
  Send,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/accounts", label: "Accounts", icon: CreditCard },
  { href: "/transfer", label: "Send money", icon: Send },
  { href: "/withdraw", label: "Withdraw", icon: Wallet },
  { href: "/transactions", label: "Activity", icon: Activity },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (mobile = false) => (
    <nav className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => mobile && setMobileOpen(false)}
            title={collapsed && !mobile ? label : undefined}
            className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
              active
                ? "bg-[#171717] text-white shadow-sm"
                : "text-black/55 hover:bg-black/[.045] hover:text-black"
            } ${collapsed && !mobile ? "justify-center" : ""}`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {(!collapsed || mobile) && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white shadow-card md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-black/7 bg-[#f5f5f2] p-4 transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-[84px]" : "md:w-[248px]"}`}
      >
        <div className={`flex h-12 items-center ${collapsed ? "md:justify-center" : "justify-between"}`}>
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 font-bold tracking-tight">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#171717] text-sm text-white">S</span>
            {(!collapsed || mobileOpen) && <span>SolidTrust</span>}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full border border-black/8 bg-white md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 flex-1">
          {nav()}
        </div>

        <div className="border-t border-black/6 pt-4">
          <form action="/api/auth/logout" method="post">
            <button
              title={collapsed ? "Sign out" : undefined}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-black/45 hover:bg-black/[.045] hover:text-black ${
                collapsed ? "md:justify-center" : ""
              }`}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {(!collapsed || mobileOpen) && <span>Sign out</span>}
            </button>
          </form>
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((v) => !v)}
            className="mt-2 hidden w-full items-center justify-center rounded-2xl border border-black/8 bg-white py-2.5 text-black/45 hover:text-black md:flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span className="ml-1 text-xs font-semibold">Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
