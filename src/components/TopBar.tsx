"use client";

import { useEffect, useState } from "react";
import { Search, Sun, Moon } from "lucide-react";
import IndustrySwitcher from "./IndustrySwitcher";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import styles from "./TopBar.module.css";

type Note = { id: number; message: string; kind: string | null; read: boolean; createdAt: string };

export default function TopBar({
  industryKey,
  industries,
  company,
  notifications,
  unread,
  canManage,
  userName,
  userRole,
}: {
  industryKey: string;
  industries: string[];
  company: string;
  notifications: Note[];
  unread: number;
  canManage: boolean;
  userName: string;
  userRole: string;
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const t = (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark";
    setTheme(t);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("sl-theme", next);
    } catch {}
    setTheme(next);
  };

  return (
    <header className={styles.bar}>
      <div className={styles.title}>
        <h1 className={styles.company}>{company}</h1>
        <IndustrySwitcher activeKey={industryKey} industries={industries} />
      </div>

      <div className={styles.search}>
        <Search size={16} className={styles.searchIcon} />
        <input className={styles.searchInput} placeholder="Search items, SKU, unit…" aria-label="Search" />
        <kbd className={styles.kbd}>⌘K</kbd>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.iconBtn}
          onClick={toggle}
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to light" : "Switch to dark"}
        >
          {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <NotificationBell notifications={notifications} unread={unread} canManage={canManage} />
        <UserMenu userName={userName} userRole={userRole} />
      </div>
    </header>
  );
}
