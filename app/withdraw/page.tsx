import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import WithdrawForm from "./withdraw-form";

export const dynamic = "force-dynamic";

export default async function WithdrawPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <WithdrawForm />;
}
