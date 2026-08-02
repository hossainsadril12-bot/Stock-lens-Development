import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { hasIndustry } from "@/lib/session";

export default async function Home() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!(await hasIndustry())) redirect("/onboarding");
  redirect("/dashboard");
}
