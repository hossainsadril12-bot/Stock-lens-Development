"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { scanStockIn, type ScanResult } from "@/app/data-actions";
import s from "@/components/shared.module.css";
import c from "./ScanPanel.module.css";

type FeedLine =
  | { kind: "ok"; barcode: string; name: string; onHand: number; hits: number }
  | { kind: "unknown"; barcode: string; hits: number }
  | { kind: "err"; barcode: string; msg: string; hits: number };

export default function ScanPanel({
  categories,
  defaultCategoryId,
  newItemHref = "/items/new",
}: {
  categories: { id: number; name: string }[];
  defaultCategoryId?: number;
  newItemHref?: string; // base path for "create item"; category + barcode appended
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [feed, setFeed] = useState<FeedLine[]>([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [pending, startTransition] = useTransition();
  const [catId, setCatId] = useState<string>(defaultCategoryId ? String(defaultCategoryId) : "");
  const lastRef = useRef<{ code: string; at: number } | null>(null);
  const scannerRef = useRef<any>(null);

  // Build the create-item URL from the chosen category + scanned barcode.
  function createHref(barcode?: string) {
    const params = new URLSearchParams();
    if (catId) params.set("category", catId);
    if (barcode) params.set("barcode", barcode);
    const qs = params.toString();
    return qs ? `${newItemHref}?${qs}` : newItemHref;
  }

  // "Enter" button: submit whatever is typed in the field.
  function submitInput() {
    const el = inputRef.current;
    if (!el) return;
    handleCode(el.value);
    el.value = "";
    el.focus();
  }

  // Keep the wedge input focused so a USB laser scanner types straight into it.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function pushFeed(next: FeedLine) {
    setFeed((prev) => {
      // Collapse repeated scans of the same barcode into one line with a hit count.
      const top = prev[0];
      if (top && top.kind === next.kind && top.barcode === next.barcode) {
        const merged = { ...next, hits: top.hits + 1 } as FeedLine;
        if (merged.kind === "ok" && top.kind === "ok") merged.onHand = (next as any).onHand;
        return [merged, ...prev.slice(1)];
      }
      return [next, ...prev].slice(0, 30);
    });
  }

  function handleCode(raw: string) {
    const code = raw.trim();
    if (!code) return;
    // Debounce: cameras fire the same frame many times a second.
    const now = Date.now();
    if (lastRef.current && lastRef.current.code === code && now - lastRef.current.at < 1200) return;
    lastRef.current = { code, at: now };

    startTransition(async () => {
      let res: ScanResult;
      try {
        res = await scanStockIn(code);
      } catch {
        pushFeed({ kind: "err", barcode: code, msg: "Scan failed", hits: 1 });
        return;
      }
      if (res.ok) {
        pushFeed({ kind: "ok", barcode: code, name: res.name, onHand: res.onHand, hits: 1 });
        router.refresh();
      } else if (res.reason === "unknown") {
        pushFeed({ kind: "unknown", barcode: code, hits: 1 });
      }
    });
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const el = e.currentTarget;
      handleCode(el.value);
      el.value = "";
    }
  }

  async function toggleCamera() {
    if (cameraOn) {
      await stopCamera();
      setCameraOn(false);
      inputRef.current?.focus();
      return;
    }
    setCameraOn(true);
    // Dynamic import: html5-qrcode touches the DOM and can't run on the server.
    const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("scan-reader", {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      verbose: false,
    });
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 160 } },
        (decoded) => handleCode(decoded),
        () => {}
      );
    } catch {
      pushFeed({ kind: "err", barcode: "camera", msg: "Camera unavailable — use USB scanner or type", hits: 1 });
      setCameraOn(false);
    }
  }

  async function stopCamera() {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        await scanner.stop();
        await scanner.clear();
      } catch {
        /* already stopped */
      }
      scannerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, []);

  return (
    <div className={c.wrap}>
      <div className={c.controls}>
        {categories.length > 0 && (
          <div className={c.catField}>
            <label className={`${s.label} ${c.topLabel}`} htmlFor="scan-cat">Category</label>
            <select
              id="scan-cat"
              className={c.catSelect}
              value={catId}
              onChange={(e) => setCatId(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className={c.scanField}>
          <label className={`${s.label} ${c.topLabel}`} htmlFor="scan">Scan or type barcode</label>
          <input
            ref={inputRef}
            id="scan"
            className={c.scanInput}
            placeholder="Point USB scanner here, or type a code + Enter"
            onKeyDown={onInputKey}
            autoComplete="off"
            inputMode="numeric"
          />
        </div>
        <button type="button" className={c.enterBtn} onClick={submitInput} disabled={pending}>
          Enter
        </button>
        <button type="button" className={c.cameraBtn} onClick={toggleCamera}>
          {cameraOn ? "Stop camera" : "Scan with phone camera"}
        </button>
      </div>
      <p className={c.hint}>
        USB laser scanner: just scan — it types here and adds +1. Known code adds stock; unknown code offers a new item.
      </p>

      {cameraOn && (
        <div className={c.camera}>
          <div id="scan-reader" className={c.reader} />
        </div>
      )}

      {feed.length > 0 && (
        <div className={c.feed}>
          {feed.map((f, i) => {
            if (f.kind === "ok")
              return (
                <div key={i} className={`${c.line} ${c.ok}`}>
                  <span>Added +{f.hits} <strong>{f.name}</strong> — now {f.onHand} on hand</span>
                  <span className={c.count}>{f.barcode}</span>
                </div>
              );
            if (f.kind === "unknown")
              return (
                <div key={i} className={`${c.line} ${c.warn}`}>
                  <span>
                    Unknown code {f.barcode} —{" "}
                    <Link href={createHref(f.barcode)}>create item</Link>
                  </span>
                  <span className={c.count}>{f.hits > 1 ? `x${f.hits}` : ""}</span>
                </div>
              );
            return (
              <div key={i} className={`${c.line} ${c.err}`}>
                <span>{f.msg}</span>
                <span className={c.count}>{f.barcode}</span>
              </div>
            );
          })}
        </div>
      )}
      {pending && <p className={c.hint}>Working…</p>}
    </div>
  );
}
