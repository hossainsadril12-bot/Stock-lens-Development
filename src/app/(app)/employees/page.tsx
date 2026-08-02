import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { can, canSeeNav } from "@/lib/permissions";
import { getTeamStaff, getDrivers } from "@/lib/queries";
import StaffManager from "./StaffManager";
import DriverManager from "./DriverManager";
import s from "@/components/shared.module.css";

const TABS = [
  { key: "staff", label: "Staff" },
  { key: "drivers", label: "Drivers" },
] as const;

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canSeeNav(user.role, "employees")) redirect("/items");
  const canManage = can(user.role, "team.manage");
  const sp = await searchParams;
  const activeTab = TABS.find((t) => t.key === sp.tab) ?? TABS[0];

  const staff = activeTab.key === "staff" ? await getTeamStaff() : [];
  const drivers = activeTab.key === "drivers" ? await getDrivers() : [];

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Employees</h1>
          <p className={s.sub}>Staff who log into StockLens, and drivers who carry transfers</p>
        </div>
      </div>

      {(() => {
        const tabs = TABS.map((t) => (
          <Link
            key={t.key}
            href={`/employees?tab=${t.key}`}
            className={t.key === activeTab.key ? s.btnPrimary : s.btn}
          >
            {t.label}
          </Link>
        ));
        return activeTab.key === "staff" ? (
          <StaffManager staff={staff} canManage={canManage} currentUserId={user.id} tabs={tabs} />
        ) : (
          <DriverManager drivers={drivers} canManage={canManage} tabs={tabs} />
        );
      })()}
    </div>
  );
}
