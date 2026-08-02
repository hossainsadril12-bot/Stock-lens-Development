import Link from "next/link";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getTeamStaff, getDrivers } from "@/lib/queries";
import { addDriver, addStaff } from "@/app/data-actions";
import { ROLE_LABEL } from "@/lib/auth";
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
  const canManage = user ? can(user.role, "team.manage") : false;
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

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/employees?tab=${t.key}`}
            className={t.key === activeTab.key ? s.btnPrimary : s.btn}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab.key === "staff" ? (
        <>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th></tr>
              </thead>
              <tbody>
                {staff.map((u) => (
                  <tr key={u.id}>
                    <td className={s.name}>{u.name}</td>
                    <td className={s.muted}>{u.email}</td>
                    <td>{ROLE_LABEL[u.role as keyof typeof ROLE_LABEL] ?? u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {canManage && (
            <div className={s.panel}>
              <h3 className={s.panelTitle}>Add staff</h3>
              <form action={addStaff} className={s.form}>
                <div className={s.formGrid}>
                  <div className={s.field}>
                    <label className={s.label} htmlFor="staff_name">Name <span className={s.req}>*</span></label>
                    <input className={s.input} id="staff_name" name="name" placeholder="Karim Ali" required />
                  </div>
                  <div className={s.field}>
                    <label className={s.label} htmlFor="staff_email">Email <span className={s.req}>*</span></label>
                    <input className={s.input} id="staff_email" name="email" type="email" placeholder="karim@anwarsupplies.com" required />
                  </div>
                </div>
                <div className={s.formGrid}>
                  <div className={s.field}>
                    <label className={s.label} htmlFor="staff_password">Password <span className={s.req}>*</span></label>
                    <input className={s.input} id="staff_password" name="password" type="password" placeholder="At least 6 characters" required minLength={6} />
                  </div>
                  <div className={s.field}>
                    <label className={s.label} htmlFor="staff_role">Role</label>
                    <select className={s.select} id="staff_role" name="role" defaultValue="staff">
                      <option value="staff">Staff</option>
                      <option value="admin">Admin / Owner</option>
                    </select>
                  </div>
                </div>
                <div className={s.formActions}>
                  <button className={s.btnPrimary} type="submit">Add staff</button>
                </div>
              </form>
            </div>
          )}
        </>
      ) : (
        <>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr><th>Name</th><th>Phone</th><th>Vehicle</th></tr>
              </thead>
              <tbody>
                {drivers.length === 0 && (
                  <tr><td colSpan={3} className={s.muted}>No drivers yet.</td></tr>
                )}
                {drivers.map((d) => (
                  <tr key={d.id}>
                    <td className={s.name}>{d.name}</td>
                    <td className={s.muted}>{d.phone ?? "—"}</td>
                    <td className={s.muted}>{d.vehicleLabel ?? "Unassigned"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {canManage && (
            <div className={s.panel}>
              <h3 className={s.panelTitle}>Add driver</h3>
              <form action={addDriver} className={s.form}>
                <div className={s.formGrid}>
                  <div className={s.field}>
                    <label className={s.label} htmlFor="name">Driver name <span className={s.req}>*</span></label>
                    <input className={s.input} id="name" name="name" placeholder="Karim Ali" required />
                  </div>
                  <div className={s.field}>
                    <label className={s.label} htmlFor="phone">Phone</label>
                    <input className={s.input} id="phone" name="phone" placeholder="+8801711-000111" />
                  </div>
                </div>
                <div className={s.formActions}>
                  <button className={s.btnPrimary} type="submit">Add driver</button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
