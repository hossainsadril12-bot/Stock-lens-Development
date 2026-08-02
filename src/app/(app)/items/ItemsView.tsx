"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, MapPin, ScanLine, Upload, ShoppingCart } from "lucide-react";
import { getIndustry, type Column } from "@/lib/industries";
import StatusPill from "@/components/StatusPill";
import ScanPanel from "@/components/ScanPanel";
import CsvImport from "@/components/CsvImport";
import SortHeader from "@/components/SortHeader";
import { useSortable } from "@/components/useSortable";
import { num, money, date } from "@/lib/format";
import type { RowData } from "@/lib/queries";
import styles from "./items.module.css";

function resolve(row: RowData, key: string): unknown {
  if (key.startsWith("attrs.")) return row.attrs?.[key.slice(6)];
  return (row as unknown as Record<string, unknown>)[key];
}

function cell(row: RowData, col: Column): string {
  const v = resolve(row, col.key);
  switch (col.format) {
    case "num":
      return v == null ? "—" : num(Number(v));
    case "money":
      return v == null ? "—" : money(Number(v));
    case "seats":
      return `${row.attrs?.seats_used ?? 0} / ${row.attrs?.seats ?? 0}`;
    case "components":
      return `${row.attrs?.components?.length ?? 0} items`;
    default:
      if (v == null || v === "") return "—";
      if (col.key === "attrs.expiry_date") return date(String(v));
      return String(v);
  }
}

const isNumCol = (col: Column) => col.format === "num" || col.format === "money" || col.format === "seats";

export default function ItemsView({
  industryKey,
  rows,
  categories,
  location,
  locationScoped,
  canCreate,
  canScan,
  scanCategories,
  canImport,
}: {
  industryKey: string;
  rows: RowData[];
  categories: string[];
  location: string;
  locationScoped: boolean;
  canCreate: boolean;
  canScan: boolean;
  scanCategories: { id: number; name: string }[];
  canImport: boolean;
}) {
  const ind = getIndustry(industryKey);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState("all");
  const [scanOpen, setScanOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (cat !== "All" && r.categoryName !== cat) return false;
        if (status !== "all" && r.statusKey !== status) return false;
        if (q) {
          const hay = `${r.name} ${r.sku ?? ""} ${r.categoryName ?? ""}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [rows, cat, status, q]
  );

  const { sorted, sortKey, dir, toggle } = useSortable(filtered, null, (r, k) => resolve(r, k));

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.h1}>Items</h1>
          <p className={styles.sub}>
            <MapPin size={13} />{" "}
            {locationScoped ? (
              <>
                Showing <strong>{location}</strong> · own-location default
              </>
            ) : (
              <strong>{location}</strong>
            )}
          </p>
        </div>
        <div className={styles.headActions}>
          {canImport && (
            <button
              type="button"
              className={styles.scanBtn}
              onClick={() => setImportOpen((v) => !v)}
              aria-expanded={importOpen}
            >
              <Upload size={16} /> {importOpen ? "Close import" : "Import CSV"}
            </button>
          )}
          {canScan && (
            <button
              type="button"
              className={styles.scanBtn}
              onClick={() => setScanOpen((v) => !v)}
              aria-expanded={scanOpen}
            >
              <ScanLine size={16} /> {scanOpen ? "Close scan" : "Scan barcode"}
            </button>
          )}
          {canScan && (
            <Link className={styles.scanBtn} href="/checkout">
              <ShoppingCart size={16} /> Checkout
            </Link>
          )}
          {canCreate && (
            <Link className={styles.addBtn} href="/items/new">
              <Plus size={16} /> Add {ind.noun.replace(/s$/, "")}
            </Link>
          )}
        </div>
      </div>

      {canImport && importOpen && (
        <div style={{ marginBottom: 20 }}>
          <CsvImport type={industryKey} />
        </div>
      )}

      {canScan && scanOpen && <ScanPanel categories={scanCategories} newItemHref="/items/new" />}

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${ind.noun}, SKU…`}
            aria-label="Search items"
          />
        </div>
        <select
          className={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {Object.entries(ind.statuses).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {categories.length > 0 && (
        <div className={styles.chips}>
          <button className={styles.chip} data-active={cat === "All"} onClick={() => setCat("All")}>
            All
          </button>
          {categories.map((c) => (
            <button key={c} className={styles.chip} data-active={cat === c} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div className={styles.count}>
        {filtered.length} of {rows.length} {ind.noun}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {ind.columns.map((col) => (
                <SortHeader
                  key={col.key}
                  label={col.label}
                  colKey={col.key}
                  sortKey={sortKey}
                  dir={dir}
                  onSort={toggle}
                  numeric={isNumCol(col)}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id}>
                {ind.columns.map((col) => {
                  if (col.kind === "status")
                    return (
                      <td key={col.key}>
                        <StatusPill industryKey={industryKey} status={r.statusKey} />
                      </td>
                    );
                  if (col.key === "name")
                    return (
                      <td key={col.key} className={styles.name}>
                        <Link className={styles.itemLink} href={`/items/${r.id}`}>
                          {cell(r, col)}
                        </Link>
                      </td>
                    );
                  const numeric = isNumCol(col);
                  const classes = [col.muted ? styles.muted : "", numeric ? "tnum" : ""].filter(Boolean).join(" ");
                  return (
                    <td key={col.key} data-num={numeric} className={classes}>
                      {cell(r, col)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No {ind.noun} match</p>
            <p className={styles.emptySub}>Try clearing the search or switching category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
