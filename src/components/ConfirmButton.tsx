"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import s from "@/components/shared.module.css";
import styles from "./ConfirmButton.module.css";

// A button that opens a styled confirmation dialog before running its action.
// Replaces window.confirm() for a consistent, on-brand experience.
export default function ConfirmButton({
  children,
  className,
  title,
  message,
  confirmLabel = "Delete",
  danger = true,
  disabled,
  onConfirm,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className={className} disabled={disabled} onClick={() => setOpen(true)}>
        {children}
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)} role="presentation">
          <div className={styles.dialog} role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
            <div className={styles.icon} data-danger={danger}>
              <AlertTriangle size={20} />
            </div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.message}>{message}</p>
            <div className={styles.actions}>
              <button type="button" className={s.btn} onClick={() => setOpen(false)}>Cancel</button>
              <button
                type="button"
                className={danger ? s.btnDanger : s.btnPrimary}
                onClick={() => { setOpen(false); onConfirm(); }}
                autoFocus
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
