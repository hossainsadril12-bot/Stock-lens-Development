"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { INDUSTRY_LIST } from "@/lib/industries";
import { chooseIndustry } from "@/app/actions";
import styles from "./IndustryPicker.module.css";

export default function IndustryPicker() {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string | null>(null);

  const choose = (key: string) => {
    setSelected(key);
    startTransition(() => {
      chooseIndustry(key);
    });
  };

  return (
    <div className={styles.grid} role="list">
      {INDUSTRY_LIST.map((ind) => {
        const Icon = ind.Icon;
        const isSel = selected === ind.key;
        return (
          <button
            key={ind.key}
            role="listitem"
            className={styles.card}
            data-selected={isSel}
            disabled={pending}
            onClick={() => choose(ind.key)}
          >
            <span className={styles.cardIcon}>
              <Icon size={22} />
            </span>
            <span className={styles.cardBody}>
              <span className={styles.cardLabel}>{ind.label}</span>
              <span className={styles.cardDesc}>{ind.description}</span>
            </span>
            <span className={styles.cardGo}>
              {isSel && pending ? <Loader2 size={16} className={styles.spin} /> : <ArrowRight size={16} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
