import AppSidebar from "@/components/app-sidebar";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { ArrowRight, CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Accounts() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const accounts = await prisma.account.findMany({
    where: { userId: user.id, isSystem: false },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen md:pl-[248px] transition-[padding]">
      <AppSidebar />
      <main className="app-shell">
        <div className="container py-10">
          <p className="text-sm text-black/40">Accounts</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-.035em]">Your accounts</h1>
          <p className="mt-3 text-black/45">Manage your SolidTrust balances and account details.</p>

          <div className="mt-9 grid gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <Link
                key={account.id}
                href={"/accounts/" + account.id}
                className="group rounded-[26px] border border-black/8 bg-white p-6 shadow-card transition hover:-translate-y-0.5"
              >
                <div className="flex justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f0f0eb]">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-[#f0f0eb] px-3 py-1 text-xs font-semibold capitalize">
                    {account.status}
                  </span>
                </div>
                <p className="mt-8 text-lg font-semibold capitalize">{account.type} account</p>
                <p className="mt-2 font-mono text-sm text-black/40">{account.accountNumber}</p>
                <div className="mt-7 flex items-center justify-between text-sm">
                  <span className="text-black/40">{account.currency}</span>
                  <span className="font-semibold">
                    View account <ArrowRight className="ml-1 inline h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
// SolidTrust deployment syntax verification
