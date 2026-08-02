"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { markNotificationsRead } from "@/app/data-actions";
import styles from "./NotificationBell.module.css";

type Note = { id: number; message: string; kind: string | null; read: boolean; createdAt: string };

export default function NotificationBell({
  notifications,
  unread,
  canManage,
}: {
  notifications: Note[];
  unread: number;
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function openMenu() {
    const next = !open;
    setOpen(next);
    if (next && canManage && unread > 0) start(() => { markNotificationsRead(); });
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.iconBtn} onClick={openMenu} aria-label={`Notifications, ${unread} unread`} aria-expanded={open}>
        <Bell size={18} />
        {unread > 0 && <span className={styles.badge}>{unread}</span>}
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.head}>
            <span className={styles.title}>Notifications</span>
            {unread > 0 && <span className={styles.mark}><CheckCheck size={14} /> Marking read</span>}
          </div>
          {notifications.length === 0 ? (
            <p className={styles.empty}>No notifications yet.</p>
          ) : (
            <ul className={styles.list}>
              {notifications.map((n) => (
                <li key={n.id} className={styles.item} data-unread={!n.read}>
                  <span className={styles.dot} data-unread={!n.read} aria-hidden />
                  <span className={styles.msg}>{n.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
