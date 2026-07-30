import Link from "next/link";
import { getIndustryKey } from "@/lib/session";
import { getReports } from "@/lib/queries";
import Pill from "@/components/Pill";
import { num, moneyCompact } from "@/lib/format";
import s from "@/components/shared.module.css";

export default async function ReportsPage() {
  const key = await getIndustryKey();
  const r = await getReports(key);

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Reports</h1>
          <p className={s.sub}>{r.industry.label} · at a glance</p>
        </div>
      </div>

      <div className={s.grid3}>
        <div className={s.stat}>
          <span className={s.statLabel}>Total {r.industry.noun}</span>
          <span className={s.statValue}>{num(r.totalItems)}</span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>Catalogue / stock value</span>
          <span className={s.statValue}>{moneyCompact(r.stockValue)}</span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>Needs attention</span>
          <span className={s.statValue}>{num(r.lowStock.length + r.outOfStock.length)}</span>
        </div>
      </div>

      <div className={s.grid2}>
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Status breakdown</h3>
          <div className={s.kv}>
            {r.statusBreakdown.map((st) => (
              <div key={st.key} style={{ display: "contents" }}>
                <span className={s.kvKey}><Pill tone={st.tone} label={st.label} /></span>
                <span className={`${s.kvVal} tnum`}>{num(st.count)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={s.panel}>
          <h3 className={s.panelTitle}>Low stock — a to-do list</h3>
          {r.lowStock.length === 0 && r.outOfStock.length === 0 ? (
            <p className={s.muted}>Nothing low or out of stock. All healthy.</p>
          ) : (
            <table className={s.table}>
              <tbody>
                {r.outOfStock.map((it) => (
                  <tr key={`o-${it.id}`}>
                    <td className={s.name}><Link href={`/items/${it.id}`}>{it.name}</Link></td>
                    <td className={s.muted}>Out of stock</td>
                  </tr>
                ))}
                {r.lowStock.map((it) => (
                  <tr key={`l-${it.id}`}>
                    <td className={s.name}><Link href={`/items/${it.id}`}>{it.name}</Link></td>
                    <td className={s.muted}>{num(it.available)} left · reorder at {num(it.reorderPoint ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
