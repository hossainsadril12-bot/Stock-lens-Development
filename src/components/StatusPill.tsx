import { getIndustry } from "@/lib/industries";
import styles from "./StatusPill.module.css";

export default function StatusPill({ industryKey, status }: { industryKey: string; status: string }) {
  const ind = getIndustry(industryKey);
  const def = ind.statuses[status] ?? { label: status || "—", tone: "neutral" as const };
  return (
    <span className={styles.pill} data-tone={def.tone}>
      <span className={styles.dot} aria-hidden />
      {def.label}
    </span>
  );
}
