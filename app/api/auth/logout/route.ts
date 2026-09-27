import { sessionCookie } from "@/lib/auth";
export async function POST(){const response=Response.redirect(new URL("/login",process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000"));response.headers.append("Set-Cookie",`${sessionCookie.name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);return response;}
