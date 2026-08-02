"use client";

import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { SortDir } from "./useSortable";
import styles from "./SortHeader.module.css";

export default function SortHeader({
  label,
  colKey,
  sortKey,
  dir,
  onSort,
  numeric,
}: {
  label: string;
  colKey: string;
  sortKey: string | null;
  dir: SortDir;
  onSort: (key: string) => void;
  numeric?: boolean;
}) {
  const active = sortKey === colKey;
  return (
    <th data-num={numeric || undefined} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={styles.btn} data-num={numeric || undefined} onClick={() => onSort(colKey)}>
        <span>{label}</span>
        {active ? (
          dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />
        ) : (
          <ChevronsUpDown size={13} className={styles.dim} />
        )}
      </button>
    </th>
  );
}
