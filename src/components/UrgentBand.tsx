"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, AlertCircle, Inbox, ArrowRight, CheckCircle2 } from "lucide-react";
import styles from "./UrgentBand.module.css";
import type { UrgentItem } from "@/lib/queries";

const ICON = { danger: AlertTriangle, warn: AlertCircle, info: Inbox } as const;

export default function UrgentBand({ items }: { items: UrgentItem[] }) {
  const [toast, setToast] = useState<string | null>(null);

  const act = (label: string, title: string) => {
    setToast(`“${label}” — wired up in a later cut (${title})`);
    window.clearTimeout((act as any)._t);
    (act as any)._t = window.setTimeout(() => setToast(null), 2600);
  };

  return (
    <section className={styles.band} aria-label="Needs you today">
      <div className={styles.header}>
        <h2 className={styles.title}>Needs you today</h2>
        <span className={styles.count}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <CheckCircle2 size={18} />
          <span>All clear — nothing needs you right now.</span>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((it, i) => {
            const Icon = ICON[it.tone];
            return (
              <li key={i} className={styles.row} data-tone={it.tone}>
                <span className={styles.marker}>
                  <Icon size={18} />
                </span>
                <span className={styles.body}>
                  <span className={styles.rowTitle}>{it.title}</span>
                  <span className={styles.meta}>{it.meta}</span>
                </span>
                {it.href ? (
                  <Link className={styles.action} href={it.href}>
                    {it.action}
                    <ArrowRight size={14} />
                  </Link>
                ) : (
                  <button className={styles.action} onClick={() => act(it.action, it.title)}>
                    {it.action}
                    <ArrowRight size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </section>
  );
}
