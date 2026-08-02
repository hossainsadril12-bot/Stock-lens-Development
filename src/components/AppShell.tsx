"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import type { Role } from "@/lib/auth";
import styles from "./AppShell.module.css";

export default function AppShell({
  industryKey,
  company,
  alertCount,
  userName,
  userRole,
  roleKey,
  children,
}: {
  industryKey: string;
  company: string;
  alertCount: number;
  userName: string;
  userRole: string;
  roleKey: Role;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={styles.shell} data-collapsed={collapsed}>
      <Sidebar industryKey={industryKey} role={roleKey} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className={styles.main}>
        <TopBar industryKey={industryKey} company={company} alertCount={alertCount} userName={userName} userRole={userRole} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
