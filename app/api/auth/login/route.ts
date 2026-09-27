import { argon2id } from "@node-rs/argon2";
import { prisma } from "@/lib/db";
import { createSessionToken, sessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email || !password) return Response.json({ error: "Email and password are required." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) return Response.json({ error: "Invalid email or password." }, { status: 401 });

    const valid = await argon2id.verify(user.passwordHash, password);
    if (!valid) return Response.json({ error: "Invalid email or password." }, { status: 401 });

    const response = Response.json({ ok: true, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
    response.headers.append("Set-Cookie", `${sessionCookie.name}=${createSessionToken(user.id)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${sessionCookie.maxAge}`);
    return response;
  } catch (error) {
    console.error("Login failed", error);
    return Response.json({ error: "Sign in could not be completed. Please try again." }, { status: 500 });
  }
}
