import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Sparkline from "./Sparkline";
import styles from "./KpiCard.module.css";
import type { Kpi } from "@/lib/queries";

export default function KpiCard({ kpi }: { kpi: Kpi }) {
  const metaText = kpi.delta ?? kpi.sub;
  const Arrow = kpi.deltaTone === "ok" ? ArrowUpRight : kpi.deltaTone === "danger" || kpi.deltaTone === "warn" ? ArrowDownRight : null;
  return (
    <div className={styles.card}>
      <span className={styles.label}>{kpi.label}</span>
      <span className={`${styles.value} tnum`}>{kpi.value}</span>
      {metaText && (
        <span className={styles.meta} data-tone={kpi.deltaTone}>
          {Arrow && <Arrow size={13} />}
          {metaText}
        </span>
      )}
      <span className={styles.spark}>
        <Sparkline data={kpi.spark} />
      </span>
    </div>
  );
}
