"use client";

import { useEffect, useState } from "react";
import { Search, Bell, Sun, Moon, LogOut } from "lucide-react";
import { getIndustry } from "@/lib/industries";
import { logout } from "@/app/actions";
import styles from "./TopBar.module.css";

export default function TopBar({
  industryKey,
  company,
  alertCount,
  userName,
  userRole,
}: {
  industryKey: string;
  company: string;
  alertCount: number;
  userName: string;
  userRole: string;
}) {
  const firstName = userName.split(" ")[0];
  const initial = userName.trim().charAt(0).toUpperCase() || "?";
  const industry = getIndustry(industryKey);
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
        <p className={styles.sub}>{industry.label} workspace</p>
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
        <button className={styles.iconBtn} aria-label={`Notifications, ${alertCount} need attention`}>
          <Bell size={18} />
          {alertCount > 0 && <span className={styles.badge}>{alertCount}</span>}
        </button>
        <div className={styles.profile}>
          <span className={styles.avatar} aria-hidden>{initial}</span>
          <span className={styles.who}>
            <span className={styles.name}>{firstName}</span>
            <span className={styles.role}>{userRole}</span>
          </span>
        </div>
        <form action={logout}>
          <button className={styles.iconBtn} type="submit" aria-label="Sign out" title="Sign out">
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
