import { argon2id } from "@node-rs/argon2";
import { prisma } from "@/lib/db";
import { assertSessionSecret, createSessionToken, sessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSessionSecret();
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (name.length < 2) return Response.json({ error: "Please enter your full name." }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return Response.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });

    const passwordHash = await argon2id.hash(password);
    const accountNumber = `30${Date.now().toString().slice(-8)}`;

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          fullName: name,
          passwordHash,
          accounts: { create: { accountNumber, type: "savings", currency: "USD" } },
        },
        select: { id: true, email: true, fullName: true },
      });
      await tx.auditLog.create({ data: { actorId: created.id, action: "user.registered", entity: "User", entityId: created.id } });
      return created;
    });

    const response = Response.json({ ok: true, user });
    response.headers.append("Set-Cookie", `${sessionCookie.name}=${createSessionToken(user.id)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${sessionCookie.maxAge}`);
    return response;
  } catch (error) {
    console.error("Registration failed", error);
    return Response.json({ error: "Registration could not be completed. Please try again." }, { status: 500 });
  }
}
