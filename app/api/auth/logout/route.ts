import { serializeClearedSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  const response = Response.redirect(new URL("/login", request.url), 303);
  response.headers.set("Set-Cookie", serializeClearedSessionCookie(secure));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
