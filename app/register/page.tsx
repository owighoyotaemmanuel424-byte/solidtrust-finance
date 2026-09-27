import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import RegisterForm from "./register-form";

export const dynamic = "force-dynamic";

export default async function Register() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return <RegisterForm />;
}
