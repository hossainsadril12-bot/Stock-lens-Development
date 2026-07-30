import { redirect } from "next/navigation";
import { getUser, ROLE_LABEL } from "@/lib/auth";
import { hasIndustry, getIndustryKey } from "@/lib/session";
import { getAlertCount, COMPANY_NAME } from "@/lib/queries";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!(await hasIndustry())) redirect("/onboarding");

  const key = await getIndustryKey();
  const alertCount = await getAlertCount(key);

  return (
    <AppShell
      industryKey={key}
      company={COMPANY_NAME}
      alertCount={alertCount}
      userName={user.name}
      userRole={ROLE_LABEL[user.role]}
      roleKey={user.role}
    >
      {children}
    </AppShell>
  );
}
