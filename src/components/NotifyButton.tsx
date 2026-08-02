"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import s from "./shared.module.css";

export default function NotifyButton({ code, destination }: { code: string; destination: string }) {
  const [sent, setSent] = useState(false);

  if (sent) return <span className={s.muted} style={{ fontSize: "0.8rem" }}>Reminder sent</span>;

  return (
    <button
      className={s.btn}
      type="button"
      onClick={() => setSent(true)}
      title={`Nudge staff at ${destination} to confirm receipt of ${code}`}
    >
      <Bell size={14} /> Notify
    </button>
  );
}
