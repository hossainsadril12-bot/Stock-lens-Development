import { getIndustryKey } from "@/lib/session";
import { getDashboard } from "@/lib/queries";
import UrgentBand from "@/components/UrgentBand";
import KpiCard from "@/components/KpiCard";
import Chart from "@/components/Chart";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const key = await getIndustryKey();
  const d = await getDashboard(key);

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.h1}>Dashboard</h1>
          <p className={styles.sub}>
            {d.industry.label} · {d.location}
          </p>
        </div>
        <span className={styles.badge}>Morning check</span>
      </div>

      <UrgentBand items={d.urgent} />

      <div className={styles.kpis}>
        {d.kpis.map((k, i) => (
          <KpiCard key={i} kpi={k} />
        ))}
      </div>

      <div className={styles.split}>
        <Chart data={d.chart} />
        <section className={styles.recent}>
          <h3 className={styles.recentTitle}>Recent activity</h3>
          <ul className={styles.recentList}>
            {d.recent.map((r, i) => (
              <li key={i} className={styles.recentRow}>
                <span className={styles.recentText}>{r.text}</span>
                <span className={styles.recentWhen}>{r.when}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
