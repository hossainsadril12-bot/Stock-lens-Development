"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2, Check } from "lucide-react";
import { INDUSTRY_LIST } from "@/lib/industries";
import { chooseIndustries } from "@/app/actions";
import styles from "./IndustryPicker.module.css";

export default function IndustryPicker() {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const submit = () => {
    if (selected.length === 0) return;
    startTransition(() => {
      chooseIndustries(selected);
    });
  };

  return (
    <>
      <div className={styles.grid} role="list">
        {INDUSTRY_LIST.map((ind) => {
          const Icon = ind.Icon;
          const isSel = selected.includes(ind.key);
          return (
            <button
              key={ind.key}
              role="listitem"
              className={styles.card}
              data-selected={isSel}
              disabled={pending}
              onClick={() => toggle(ind.key)}
              aria-pressed={isSel}
            >
              <span className={styles.cardIcon}>
                <Icon size={22} />
              </span>
              <span className={styles.cardBody}>
                <span className={styles.cardLabel}>{ind.label}</span>
                <span className={styles.cardDesc}>{ind.description}</span>
              </span>
              <span className={styles.cardGo}>{isSel ? <Check size={18} /> : null}</span>
            </button>
          );
        })}
      </div>

      <button className={styles.continue} onClick={submit} disabled={pending || selected.length === 0}>
        {pending ? <Loader2 size={16} className={styles.spin} /> : <ArrowRight size={16} />}
        Continue{selected.length > 0 ? ` with ${selected.length}` : ""}
      </button>
    </>
  );
}
