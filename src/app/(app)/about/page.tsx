import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import s from "@/components/shared.module.css";

export default async function AboutPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>About StockLens</h1>
          <p className={s.sub}>Inventory that shapes itself to what you track</p>
        </div>
      </div>

      <div className={s.panel}>
        <h3 className={s.panelTitle}>What it is</h3>
        <p className={s.sub} style={{ marginTop: 0 }}>
          StockLens is the inventory module of VantaTrack. One system tracks five kinds of stock —
          physical goods, real-estate units, equipment, digital licences and kits — and reshapes its
          columns, statuses and metrics per industry.
        </p>
      </div>
      <div className={s.panel}>
        <h3 className={s.panelTitle}>This build</h3>
        <div className={s.kv}>
          <span className={s.kvKey}>Stage</span>
          <span className={s.kvVal}>Wireframe / prototype</span>
          <span className={s.kvKey}>Part of</span>
          <span className={s.kvVal}>VantaTrack suite</span>
        </div>
      </div>
    </div>
  );
}
