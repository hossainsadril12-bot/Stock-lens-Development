"use client";

import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

// Generic client-side table sorting. Pass an accessor for computed/nested keys.
export function useSortable<T>(
  rows: T[],
  initialKey: string | null = null,
  accessor: (row: T, key: string) => unknown = (r, k) => (r as Record<string, unknown>)[k]
) {
  const [sortKey, setSortKey] = useState<string | null>(initialKey);
  const [dir, setDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = accessor(a, sortKey);
      const bv = accessor(b, sortKey);
      let c: number;
      if (typeof av === "number" && typeof bv === "number") c = av - bv;
      else c = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
      return dir === "asc" ? c : -c;
    });
    return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortKey, dir]);

  function toggle(key: string) {
    if (sortKey === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDir("asc");
    }
  }

  return { sorted, sortKey, dir, toggle };
}
