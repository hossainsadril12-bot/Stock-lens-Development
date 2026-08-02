"use client";

import { Printer } from "lucide-react";
import s from "./shared.module.css";

export default function PrintButton() {
  return (
    <button className={s.btnPrimary} type="button" onClick={() => window.print()}>
      <Printer size={15} /> Print receipt
    </button>
  );
}
