"use client";

import { useRef, useState, useTransition } from "react";
import { ScanLine, Plus, Trash2, ShoppingCart } from "lucide-react";
import { createSale } from "@/app/data-actions";
import { money, num } from "@/lib/format";
import s from "@/components/shared.module.css";
import c from "./checkout.module.css";

type Cat = { id: number; name: string; barcode: string | null; price: number; onHand: number };
type Line = { itemId: number; name: string; unitPrice: number; onHand: number; qty: number };

export default function CheckoutRegister({ catalog }: { catalog: Cat[] }) {
  const scanRef = useRef<HTMLInputElement>(null);
  const [customer, setCustomer] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [pickId, setPickId] = useState("");
  const [note, setNote] = useState<string>("");
  const [pending, start] = useTransition();

  function addOrInc(cat: Cat) {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.itemId === cat.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(next[i].qty + 1, cat.onHand) };
        return next;
      }
      return [...prev, { itemId: cat.id, name: cat.name, unitPrice: cat.price, onHand: cat.onHand, qty: 1 }];
    });
  }

  function onScanKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const code = e.currentTarget.value.trim();
    e.currentTarget.value = "";
    if (!code) return;
    const cat = catalog.find((x) => x.barcode === code);
    if (cat) { addOrInc(cat); setNote(`Added ${cat.name}`); }
    else setNote(`No item with barcode ${code}`);
  }

  function addPicked() {
    const cat = catalog.find((x) => String(x.id) === pickId);
    if (cat) { addOrInc(cat); setPickId(""); }
  }

  function setQty(itemId: number, qty: number) {
    setLines((prev) => prev.map((l) => (l.itemId === itemId ? { ...l, qty: Math.max(1, Math.min(qty || 1, l.onHand)) } : l)));
  }
  function remove(itemId: number) {
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));
  }

  const total = lines.reduce((a, l) => a + l.qty * l.unitPrice, 0);
  const canComplete = customer.trim().length > 0 && lines.length > 0 && !pending;

  function complete() {
    if (!canComplete) return;
    start(() => {
      createSale(customer, lines.map((l) => ({ itemId: l.itemId, qty: l.qty })));
    });
  }

  return (
    <div className={c.grid}>
      <div className={c.left}>
        <div className={s.panel}>
          <label className={s.label} htmlFor="scan">Scan or type barcode</label>
          <input
            ref={scanRef}
            id="scan"
            className={c.scanInput}
            placeholder="Point USB scanner here, or type a code + Enter"
            onKeyDown={onScanKey}
            autoComplete="off"
            inputMode="numeric"
            autoFocus
          />
          {note && <p className={c.note}>{note}</p>}

          <div className={c.manual}>
            <select className={c.select} value={pickId} onChange={(e) => setPickId(e.target.value)}>
              <option value="">Add item manually…</option>
              {catalog.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name} — {num(cat.onHand)} on hand</option>
              ))}
            </select>
            <button type="button" className={s.btn} onClick={addPicked} disabled={!pickId}>
              <Plus size={15} /> Add item
            </button>
          </div>
        </div>

        <div className={s.panel}>
          <h3 className={s.panelTitle}><ShoppingCart size={16} /> Cart</h3>
          {lines.length === 0 ? (
            <p className={c.empty}>Scan or add items to start a sale.</p>
          ) : (
            <table className={s.table}>
              <thead>
                <tr><th>Item</th><th data-num="true">Qty</th><th data-num="true">Unit</th><th data-num="true">Amount</th><th /></tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.itemId}>
                    <td className={s.name}>{l.name}</td>
                    <td data-num="true">
                      <input
                        className={c.qty}
                        type="number"
                        min="1"
                        max={l.onHand}
                        value={l.qty}
                        onChange={(e) => setQty(l.itemId, Number(e.target.value))}
                        aria-label={`Quantity of ${l.name}`}
                      />
                    </td>
                    <td data-num="true" className="tnum">{money(l.unitPrice)}</td>
                    <td data-num="true" className="tnum">{money(l.qty * l.unitPrice)}</td>
                    <td>
                      <button type="button" className={c.iconBtn} onClick={() => remove(l.itemId)} aria-label={`Remove ${l.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={c.right}>
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Sale</h3>
          <div className={s.field}>
            <label className={s.label} htmlFor="customer">Customer <span className={s.req}>*</span></label>
            <input className={s.input} id="customer" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="e.g. Karim Traders" />
          </div>
          <div className={c.totalRow}>
            <span>Total</span>
            <span className={c.totalVal}>{money(total)}</span>
          </div>
          <button className={s.btnPrimary} style={{ width: "100%", justifyContent: "center", marginTop: 12 }} onClick={complete} disabled={!canComplete}>
            {pending ? "Completing…" : "Complete sale"}
          </button>
          {!customer.trim() && lines.length > 0 && <p className={c.hint}>Add a customer name to complete.</p>}
        </div>
      </div>
    </div>
  );
}
