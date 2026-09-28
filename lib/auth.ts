import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "solidtrust_session";
const SESSION_DAYS = 7;

function secret() {
  const configured = process.env.AUTH_SESSION_SECRET?.trim();
  if (!configured || configured.length < 32) {
    throw new Error("AUTH_SESSION_SECRET must be configured with at least 32 characters");
  }
  return configured;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function assertSessionSecret() {
  secret();
}

export function createSessionToken(userId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  const payload = encode(JSON.stringify({ userId, expiresAt }));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string) {
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!signature) return null;

  try {
    const expected = sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId?: string;
      expiresAt?: number;
    };

    if (!data.userId || !data.expiresAt) return null;
    if (data.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return data.userId;
  } catch {
    return null;
  }
}

export const sessionCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_DAYS * 86400,
};

export function serializeSessionCookie(token: string, secure: boolean) {
  return [
    `${sessionCookie.name}=${token}`,
    "Path=/",
    "HttpOnly",
    secure ? "Secure" : "",
    "SameSite=Lax",
    `Max-Age=${sessionCookie.maxAge}`,
  ].filter(Boolean).join("; ");
}

export function serializeClearedSessionCookie(secure: boolean) {
  return [
    `${sessionCookie.name}=`,
    "Path=/",
    "HttpOnly",
    secure ? "Secure" : "",
    "SameSite=Lax",
    "Max-Age=0",
  ].filter(Boolean).join("; ");
}
