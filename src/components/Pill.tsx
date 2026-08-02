import styles from "./StatusPill.module.css";

export default function Pill({ tone, label }: { tone: string; label: string }) {
  return (
    <span className={styles.pill} data-tone={tone}>
      <span className={styles.dot} aria-hidden />
      {label}
    </span>
  );
}
