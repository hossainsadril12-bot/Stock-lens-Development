"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings, Shield, Info, BookOpen, LogOut, ChevronDown } from "lucide-react";
import { logout } from "@/app/actions";
import styles from "./UserMenu.module.css";

export default function UserMenu({ userName, userRole }: { userName: string; userRole: string }) {
  const firstName = userName.split(" ")[0];
  const initial = userName.trim().charAt(0).toUpperCase() || "?";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.avatar} aria-hidden>{initial}</span>
        <span className={styles.who}>
          <span className={styles.name}>{firstName}</span>
          <span className={styles.role}>{userRole}</span>
        </span>
        <ChevronDown size={15} className={styles.chev} data-open={open} />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHead}>
            <span className={styles.menuName}>{userName}</span>
            <span className={styles.menuRole}>{userRole}</span>
          </div>
          <Link className={styles.item} href="/guide" role="menuitem" onClick={() => setOpen(false)}>
            <BookOpen size={16} /> User Guide
          </Link>
          <Link className={styles.item} href="/settings" role="menuitem" onClick={() => setOpen(false)}>
            <Settings size={16} /> Settings
          </Link>
          <Link className={styles.item} href="/privacy" role="menuitem" onClick={() => setOpen(false)}>
            <Shield size={16} /> Privacy
          </Link>
          <Link className={styles.item} href="/about" role="menuitem" onClick={() => setOpen(false)}>
            <Info size={16} /> About
          </Link>
          <div className={styles.sep} />
          <form action={logout}>
            <button className={`${styles.item} ${styles.danger}`} type="submit" role="menuitem">
              <LogOut size={16} /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
