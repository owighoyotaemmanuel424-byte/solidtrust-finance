import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "solidtrust_session";
const SESSION_DAYS = 7;

function secret() {
  const value = process.env.AUTH_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SESSION_SECRET must be configured with at least 32 characters");
  return value;
}
function encode(value: string) { return Buffer.from(value, "utf8").toString("base64url"); }
function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }

export function assertSessionSecret() { secret(); }

export function createSessionToken(userId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  const payload = encode(JSON.stringify({ userId, expiresAt }));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId?: string; expiresAt?: number };
    return data.userId && data.expiresAt && data.expiresAt > Math.floor(Date.now() / 1000) ? data.userId : null;
  } catch { return null; }
}

export const sessionCookie = { name: COOKIE_NAME, maxAge: SESSION_DAYS * 86400 };
