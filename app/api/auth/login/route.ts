import { hash, verify } from "@node-rs/argon2";
import { prisma } from "@/lib/db";
import { assertSessionSecret, createSessionToken, serializeSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSessionSecret();

    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!/^\\S+@\\S+\\.\\S+$/.test(email) || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await verify(user.passwordHash, password);
    if (!valid) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = createSessionToken(user.id);
    const secure = new URL(request.url).protocol === "https:";
    const response = Response.json({
      ok: true,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    });

    response.headers.set("Set-Cookie", serializeSessionCookie(token, secure));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Login failed", error);

    if (error instanceof Error && error.message.includes("AUTH_SESSION_SECRET")) {
      return Response.json(
        { error: "Sign in is temporarily unavailable because authentication is not configured." },
        { status: 503 },
      );
    }

    return Response.json({ error: "Sign in could not be completed. Please try again." }, { status: 500 });
  }
}
