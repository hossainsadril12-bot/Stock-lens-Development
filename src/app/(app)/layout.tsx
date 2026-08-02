import { redirect } from "next/navigation";
import { getUser, ROLE_LABEL } from "@/lib/auth";
import { hasIndustry, getIndustryKey, getAllowedIndustries } from "@/lib/session";
import { COMPANY_NAME, getNotifications } from "@/lib/queries";
import { can } from "@/lib/permissions";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!(await hasIndustry())) redirect("/onboarding");

  const key = await getIndustryKey();
  const industries = await getAllowedIndustries();
  const notes = await getNotifications();

  return (
    <AppShell
      industryKey={key}
      industries={industries}
      company={COMPANY_NAME}
      notifications={notes.items}
      unread={notes.unread}
      canManage={can(user.role, "team.manage")}
      userName={user.name}
      userRole={ROLE_LABEL[user.role]}
      roleKey={user.role}
    >
      {children}
    </AppShell>
  );
}
