import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import s from "@/components/shared.module.css";

export default async function PrivacyPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Privacy</h1>
          <p className={s.sub}>How StockLens handles your workspace data</p>
        </div>
      </div>

      <div className={s.panel}>
        <h3 className={s.panelTitle}>Your data</h3>
        <p className={s.sub} style={{ marginTop: 0 }}>
          Inventory, suppliers, employees and movement history belong to your organisation. StockLens
          stores them to run your workspace and never sells them.
        </p>
      </div>
      <div className={s.panel}>
        <h3 className={s.panelTitle}>Access</h3>
        <p className={s.sub} style={{ marginTop: 0 }}>
          Role-based permissions control who sees and changes what: Admin, Staff and Viewer. Only Admins
          manage the team, suppliers and destructive actions.
        </p>
      </div>
      <div className={s.panel}>
        <h3 className={s.panelTitle}>Wireframe notice</h3>
        <p className={s.sub} style={{ marginTop: 0 }}>
          This is a wireframe build. The full privacy policy, data-retention and export terms land in a later pass.
        </p>
      </div>
    </div>
  );
}
