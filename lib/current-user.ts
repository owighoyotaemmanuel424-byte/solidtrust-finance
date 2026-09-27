import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { sessionCookie, verifySessionToken } from "@/lib/auth";

export async function getCurrentUser() {
  const token = (await cookies()).get(sessionCookie.name)?.value;
  const userId = verifySessionToken(token);
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, phone: true, role: true, kycStatus: true, mfaEnabled: true },
  });
}
