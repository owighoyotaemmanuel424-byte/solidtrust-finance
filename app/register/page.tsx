import Link from "next/link";
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to create your account.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to connect to SolidTrust Finance. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="grid min-h-screen place-items-center bg-trust-50 p-5"><div className="w-full max-w-md rounded-3xl border border-trust-100 bg-white p-8 shadow-soft"><Link href="/" className="font-bold text-trust-800">← SolidTrust Finance</Link><h1 className="mt-10 text-3xl font-bold">Create your account</h1><p className="mt-2 text-slate-500">A secure starting point for your financial journey.</p><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-semibold">Full name<input name="name" required className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-trust-500" placeholder="Your full name"/></label><label className="block text-sm font-semibold">Email<input type="email" name="email" required className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-trust-500" placeholder="you@example.com"/></label><label className="block text-sm font-semibold">Password<input type="password" name="password" minLength={8} required className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-trust-500" placeholder="At least 8 characters"/></label>{error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<button type="submit" disabled={loading} className="w-full rounded-xl bg-trust-700 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Creating account…" : "Create account"}</button></form><p className="mt-7 text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-semibold text-trust-700">Sign in</Link></p></div></main>;
}
