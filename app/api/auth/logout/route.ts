import { sessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const response = Response.redirect(new URL("/login", request.url));
  const secure = new URL(request.url).protocol === "https:";
  response.headers.set("Set-Cookie", `${sessionCookie.name}=; Path=/; HttpOnly; ${secure ? "Secure; " : ""}SameSite=Lax; Max-Age=0`);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
