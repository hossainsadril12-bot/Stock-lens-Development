"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addSupplier, updateSupplier, deleteSupplier } from "@/app/data-actions";
import { num } from "@/lib/format";
import SortHeader from "@/components/SortHeader";
import { useSortable } from "@/components/useSortable";
import ConfirmButton from "@/components/ConfirmButton";
import s from "@/components/shared.module.css";

type Supplier = { id: number; name: string; phone: string | null; leadTimeDays: number; openPOs: number };

export default function SupplierAdmin({
  suppliers,
  canManage,
}: {
  suppliers: Supplier[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addLead, setAddLead] = useState("7");
  const [eName, setEName] = useState("");
  const [ePhone, setEPhone] = useState("");
  const [eLead, setELead] = useState("");
  const { sorted, sortKey, dir, toggle } = useSortable(suppliers, null);

  function doAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim()) return;
    start(async () => {
      await addSupplier(addName, addPhone, Number(addLead));
      setAddName(""); setAddPhone(""); setAddLead("7"); setAddOpen(false);
      router.refresh();
    });
  }
  function startEdit(sup: Supplier) {
    setEditId(sup.id); setEName(sup.name); setEPhone(sup.phone ?? ""); setELead(String(sup.leadTimeDays));
  }
  function doSave(id: number) {
    if (!eName.trim()) return;
    start(async () => {
      await updateSupplier(id, eName, ePhone, Number(eLead));
      setEditId(null);
      router.refresh();
    });
  }
  function delMsg(sup: Supplier) {
    return sup.openPOs > 0
      ? `"${sup.name}" has ${sup.openPOs} open PO(s). This can't be undone.`
      : `"${sup.name}" will be removed. This can't be undone.`;
  }
  function doDelete(sup: Supplier) {
    start(async () => { await deleteSupplier(sup.id); router.refresh(); });
  }

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Suppliers</h1>
          <p className={s.sub}>Contacts and lead times that feed the reorder forecast</p>
        </div>
        {canManage && (
          <button className={s.btnPrimary} onClick={() => setAddOpen((v) => !v)}>
            <Plus size={16} /> {addOpen ? "Close" : "Add supplier"}
          </button>
        )}
      </div>

      {canManage && addOpen && (
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Add supplier</h3>
          <form onSubmit={doAdd} className={s.form}>
            <div className={s.formGrid}>
              <div className={s.field}>
                <label className={s.label} htmlFor="sup_name">Supplier name <span className={s.req}>*</span></label>
                <input className={s.input} id="sup_name" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="PaperCo" required />
              </div>
              <div className={s.field}>
                <label className={s.label} htmlFor="sup_phone">Phone</label>
                <input className={s.input} id="sup_phone" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} placeholder="+8801711-000111" />
              </div>
            </div>
            <div className={s.formGrid}>
              <div className={s.field}>
                <label className={s.label} htmlFor="sup_lead">Lead time (days)</label>
                <input className={s.input} id="sup_lead" type="number" min="0" value={addLead} onChange={(e) => setAddLead(e.target.value)} />
              </div>
              <div className={s.field} />
            </div>
            <div className={s.formActions}>
              <button className={s.btnPrimary} type="submit" disabled={pending}>Add supplier</button>
              <button className={s.btn} type="button" onClick={() => setAddOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <SortHeader label="Supplier" colKey="name" sortKey={sortKey} dir={dir} onSort={toggle} />
              <SortHeader label="Phone" colKey="phone" sortKey={sortKey} dir={dir} onSort={toggle} />
              <SortHeader label="Lead time (days)" colKey="leadTimeDays" sortKey={sortKey} dir={dir} onSort={toggle} numeric />
              <SortHeader label="Open POs" colKey="openPOs" sortKey={sortKey} dir={dir} onSort={toggle} numeric />
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 && (
              <tr><td colSpan={canManage ? 5 : 4} className={s.muted}>No suppliers yet.</td></tr>
            )}
            {sorted.map((sup) => {
              const editing = editId === sup.id;
              return (
                <tr key={sup.id}>
                  <td className={s.name}>
                    {editing ? <input className={s.input} value={eName} onChange={(e) => setEName(e.target.value)} aria-label="Supplier name" /> : sup.name}
                  </td>
                  <td className={s.muted}>
                    {editing ? <input className={s.input} value={ePhone} onChange={(e) => setEPhone(e.target.value)} aria-label="Phone" /> : (sup.phone ?? "—")}
                  </td>
                  <td data-num="true" className="tnum">
                    {editing ? <input className={s.input} type="number" min="0" value={eLead} onChange={(e) => setELead(e.target.value)} aria-label="Lead time" style={{ maxWidth: 100 }} /> : num(sup.leadTimeDays)}
                  </td>
                  <td data-num="true" className="tnum">{num(sup.openPOs)}</td>
                  {canManage && (
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        {editing ? (
                          <>
                            <button className={s.btnPrimary} onClick={() => doSave(sup.id)} disabled={pending}>Save</button>
                            <button className={s.btn} onClick={() => setEditId(null)} disabled={pending}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className={s.btn} onClick={() => startEdit(sup)}>Edit</button>
                            <ConfirmButton className={s.btnDanger} title="Delete supplier" message={delMsg(sup)} onConfirm={() => doDelete(sup)} disabled={pending}>Delete</ConfirmButton>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
