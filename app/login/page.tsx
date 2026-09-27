import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function Login() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return <LoginForm />;
}
