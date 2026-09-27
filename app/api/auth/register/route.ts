import { randomUUID } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { prisma } from "@/lib/db";
import { assertSessionSecret, createSessionToken, sessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPrismaUniqueError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";
}

export async function POST(request: Request) {
  try {
    assertSessionSecret();

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (name.length < 2) {
      return Response.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return Response.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password);
    const accountNumber = `30${randomUUID().replace(/-/g, "").slice(0, 10)}`;

    // Keep the account creation path on a simple Prisma write transaction.
    // This avoids requiring an interactive transaction from the Neon adapter.
    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email,
          fullName: name,
          passwordHash,
          accounts: {
            create: {
              accountNumber,
              type: "savings",
              currency: "USD",
            },
          },
        },
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      }),
    ]);

    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "user.registered",
          entity: "User",
          entityId: user.id,
        },
      });
    } catch (auditError) {
      console.error("Registration audit log failed", auditError);
    }

    const response = Response.json({ ok: true, user }, { status: 201 });
    const secure = new URL(request.url).protocol === "https:";
    response.headers.append(
      "Set-Cookie",
      `${sessionCookie.name}=${createSessionToken(user.id)}; Path=/; HttpOnly; ${secure ? "Secure; " : ""}SameSite=Lax; Max-Age=${sessionCookie.maxAge}`,
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Registration failed", error);

    if (error instanceof Error && error.message.includes("AUTH_SESSION_SECRET")) {
      return Response.json(
        { error: "Registration is temporarily unavailable because authentication is not configured." },
        { status: 503 },
      );
    }

    if (isPrismaUniqueError(error)) {
      return Response.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "Registration could not be completed. Please try again." },
      { status: 500 },
    );
  }
}
