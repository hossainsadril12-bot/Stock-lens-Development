"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import type { Role } from "@/lib/auth";
import styles from "./AppShell.module.css";

type Note = { id: number; message: string; kind: string | null; read: boolean; createdAt: string };

export default function AppShell({
  industryKey,
  industries,
  company,
  notifications,
  unread,
  canManage,
  userName,
  userRole,
  roleKey,
  children,
}: {
  industryKey: string;
  industries: string[];
  company: string;
  notifications: Note[];
  unread: number;
  canManage: boolean;
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
        <TopBar
          industryKey={industryKey}
          industries={industries}
          company={company}
          notifications={notifications}
          unread={unread}
          canManage={canManage}
          userName={userName}
          userRole={userRole}
        />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
