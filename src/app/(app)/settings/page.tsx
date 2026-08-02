import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, ROLE_LABEL } from "@/lib/auth";
import { getIndustryKey } from "@/lib/session";
import { getIndustry } from "@/lib/industries";
import { logout } from "@/app/actions";
import s from "@/components/shared.module.css";

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const key = await getIndustryKey();
  const ind = getIndustry(key);

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Settings</h1>
          <p className={s.sub}>Your account and workspace</p>
        </div>
      </div>

      <div className={s.grid2}>
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Account</h3>
          <div className={s.kv}>
            <span className={s.kvKey}>Name</span>
            <span className={s.kvVal}>{user.name}</span>
            <span className={s.kvKey}>Email</span>
            <span className={s.kvVal}>{user.email}</span>
            <span className={s.kvKey}>Role</span>
            <span className={s.kvVal}>{ROLE_LABEL[user.role]}</span>
          </div>
        </div>

        <div className={s.panel}>
          <h3 className={s.panelTitle}>Workspace</h3>
          <div className={s.kv}>
            <span className={s.kvKey}>Industry</span>
            <span className={s.kvVal}>{ind.label}</span>
            <span className={s.kvKey}>Company</span>
            <span className={s.kvVal}>Anwar Supplies &amp; Properties</span>
          </div>
          <div className={s.formActions}>
            <Link className={s.btn} href="/onboarding">Change industry</Link>
          </div>
        </div>
      </div>

      <div className={s.panel}>
        <h3 className={s.panelTitle}>Appearance</h3>
        <p className={s.sub} style={{ marginTop: 0 }}>
          Use the sun / moon toggle in the top bar to switch light and dark. This is a wireframe stage —
          brand colour lands in a later pass.
        </p>
      </div>

      <div className={s.panel}>
        <h3 className={s.panelTitle}>Session</h3>
        <form action={logout} className={s.formActions}>
          <button className={s.btn} type="submit">Sign out</button>
        </form>
      </div>
    </div>
  );
}
