import styles from "./Chart.module.css";
import type { ChartData } from "@/lib/queries";

export default function Chart({ data }: { data: ChartData }) {
  const max = Math.max(...data.series, 1);
  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h3 className={styles.title}>{data.title}</h3>
          <p className={styles.sub}>Last 12 months · {data.unit}</p>
        </div>
      </div>
      <div className={styles.chart} role="img" aria-label={`${data.title}, last 12 months`}>
        {data.series.map((v, i) => (
          <div className={styles.col} key={i}>
            <div className={styles.barTrack}>
              <div
                className={styles.bar}
                style={{ height: `${(v / max) * 100}%`, animationDelay: `${i * 28}ms` }}
                title={`${data.labels[i]}: ${v}`}
              />
            </div>
            <span className={styles.xlabel}>{data.labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
