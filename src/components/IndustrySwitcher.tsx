"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, Check } from "lucide-react";
import { getIndustry } from "@/lib/industries";
import { setActiveIndustry } from "@/app/actions";
import styles from "./IndustrySwitcher.module.css";

export default function IndustrySwitcher({
  activeKey,
  industries,
}: {
  activeKey: string;
  industries: string[]; // allowed industry keys
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const active = getIndustry(activeKey);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Only one industry → no switching, just a label.
  if (industries.length <= 1) {
    return <p className={styles.single}>{active.label} workspace</p>;
  }

  function pick(key: string) {
    setOpen(false);
    if (key === activeKey) return;
    start(() => { setActiveIndustry(key); });
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} disabled={pending}>
        <active.Icon size={15} />
        <span>{active.label}</span>
        <ChevronDown size={14} className={styles.chev} data-open={open} />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <p className={styles.menuLabel}>Switch workspace</p>
          {industries.map((key) => {
            const ind = getIndustry(key);
            const Icon = ind.Icon;
            return (
              <button key={key} className={styles.item} onClick={() => pick(key)} role="menuitem">
                <Icon size={16} />
                <span>{ind.label}</span>
                {key === activeKey && <Check size={15} className={styles.check} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
