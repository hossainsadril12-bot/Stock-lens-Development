"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Download, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  IMPORTABLE_TYPES,
  IMPORT_COLUMNS,
  buildTemplateCsv,
  parseAndValidate,
  type ImportType,
  type ParseResult,
} from "@/lib/csv-import";
import { importItems, type ImportResult } from "@/app/data-actions";
import s from "@/components/shared.module.css";
import c from "./CsvImport.module.css";

export default function CsvImport({
  type,
  redirectTo,
}: {
  type: string;
  redirectTo?: string; // navigate here after a successful import (else refresh)
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, start] = useTransition();

  const importable = (IMPORTABLE_TYPES as string[]).includes(type);
  if (!importable) {
    return (
      <div className={c.notice}>
        CSV import isn’t available for this item type yet. It currently supports Warehouse and Real Estate items.
      </div>
    );
  }
  const it = type as ImportType;
  const columns = IMPORT_COLUMNS[it].map((col) => col.key);

  function downloadTemplate() {
    const csv = buildTemplateCsv(it);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stocklens-${it}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (res) => {
        setPreview(parseAndValidate(it, res.data));
      },
      error: () => {
        setPreview({ valid: [], errors: [{ row: 0, reason: "Could not read this file" }], total: 0 });
      },
    });
  }

  function doImport() {
    if (!preview || preview.valid.length === 0) return;
    start(async () => {
      const r = await importItems(it, preview.valid);
      setResult(r);
      setPreview(null);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <div className={c.wrap}>
      <div className={c.head}>
        <div>
          <p className={c.step}>1 — Get the template</p>
          <p className={c.hint}>Columns: {columns.join(", ")}</p>
        </div>
        <button type="button" className={s.btn} onClick={downloadTemplate}>
          <Download size={15} /> Download template
        </button>
      </div>

      <div className={c.head}>
        <div>
          <p className={c.step}>2 — Upload your filled CSV</p>
          {fileName && <p className={c.hint}>{fileName}</p>}
        </div>
        <label className={s.btn} style={{ cursor: "pointer" }}>
          <Upload size={15} /> Choose CSV
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {preview && (
        <div className={c.preview}>
          <div className={c.summary}>
            <span className={c.pillOk}>
              <CheckCircle2 size={14} /> {preview.valid.length} ready
            </span>
            {preview.errors.length > 0 && (
              <span className={c.pillWarn}>
                <AlertTriangle size={14} /> {preview.errors.length} to fix
              </span>
            )}
            <span className={c.muted}>{preview.total} rows read</span>
          </div>

          {preview.valid.length > 0 && (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>{columns.map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.valid.slice(0, 8).map((row, i) => (
                    <tr key={i}>
                      {columns.map((h) => (
                        <td key={h} className={s.muted}>{row[h] == null ? "—" : String(row[h])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.valid.length > 8 && (
                <p className={c.hint}>…and {preview.valid.length - 8} more</p>
              )}
            </div>
          )}

          {preview.errors.length > 0 && (
            <ul className={c.errList}>
              {preview.errors.slice(0, 8).map((er) => (
                <li key={er.row}>
                  <strong>Row {er.row}:</strong> {er.reason}
                </li>
              ))}
              {preview.errors.length > 8 && <li className={c.muted}>…and {preview.errors.length - 8} more</li>}
            </ul>
          )}

          <div className={c.actions}>
            <button
              type="button"
              className={s.btnPrimary}
              onClick={doImport}
              disabled={pending || preview.valid.length === 0}
            >
              {pending ? "Importing…" : `Import ${preview.valid.length} item${preview.valid.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className={c.done}>
          <CheckCircle2 size={16} /> Imported {result.inserted} item{result.inserted === 1 ? "" : "s"}
          {result.categoriesCreated > 0 && ` · created ${result.categoriesCreated} new categor${result.categoriesCreated === 1 ? "y" : "ies"}`}.
        </div>
      )}
    </div>
  );
}
