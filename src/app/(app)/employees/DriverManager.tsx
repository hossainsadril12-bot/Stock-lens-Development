"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addDriver, updateDriver, deleteDriver } from "@/app/data-actions";
import SortHeader from "@/components/SortHeader";
import { useSortable } from "@/components/useSortable";
import ConfirmButton from "@/components/ConfirmButton";
import s from "@/components/shared.module.css";

type Driver = { id: number; name: string; phone: string | null; vehicleLabel: string | null };

export default function DriverManager({
  drivers,
  canManage,
  tabs,
}: {
  drivers: Driver[];
  canManage: boolean;
  tabs?: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [eName, setEName] = useState("");
  const [ePhone, setEPhone] = useState("");
  const { sorted, sortKey, dir, toggle } = useSortable(drivers, null, (r, k) =>
    k === "vehicle" ? r.vehicleLabel ?? "" : (r as Record<string, unknown>)[k]
  );

  function doSave(id: number) {
    if (!eName.trim()) return;
    start(async () => { await updateDriver(id, eName, ePhone); setEditId(null); router.refresh(); });
  }
  function doDelete(d: Driver) {
    start(async () => { await deleteDriver(d.id); router.refresh(); });
  }

  return (
    <>
      <div className={s.tabRow}>
        <div className={s.tabs}>{tabs}</div>
        {canManage && (
          <button className={s.btnPrimary} onClick={() => setAddOpen((v) => !v)}>
            <Plus size={16} /> {addOpen ? "Close" : "Add driver"}
          </button>
        )}
      </div>

      {canManage && addOpen && (
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Add driver</h3>
          <form action={addDriver} className={s.form}>
            <div className={s.formGrid}>
              <div className={s.field}>
                <label className={s.label} htmlFor="name">Driver name <span className={s.req}>*</span></label>
                <input className={s.input} id="name" name="name" placeholder="Karim Ali" required />
              </div>
              <div className={s.field}>
                <label className={s.label} htmlFor="phone">Phone</label>
                <input className={s.input} id="phone" name="phone" placeholder="+8801711-000111" />
              </div>
            </div>
            <div className={s.formActions}>
              <button className={s.btnPrimary} type="submit">Add driver</button>
              <button className={s.btn} type="button" onClick={() => setAddOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <h3 className={s.panelTitle} style={{ marginBottom: 12 }}>Driver information</h3>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <SortHeader label="Name" colKey="name" sortKey={sortKey} dir={dir} onSort={toggle} />
              <SortHeader label="Phone" colKey="phone" sortKey={sortKey} dir={dir} onSort={toggle} />
              <SortHeader label="Vehicle" colKey="vehicle" sortKey={sortKey} dir={dir} onSort={toggle} />
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 && <tr><td colSpan={canManage ? 4 : 3} className={s.muted}>No drivers yet.</td></tr>}
            {sorted.map((d) => {
              const editing = editId === d.id;
              return (
                <tr key={d.id}>
                  <td className={s.name}>
                    {editing ? <input className={s.input} value={eName} onChange={(e) => setEName(e.target.value)} aria-label="Name" /> : d.name}
                  </td>
                  <td className={s.muted}>
                    {editing ? <input className={s.input} value={ePhone} onChange={(e) => setEPhone(e.target.value)} aria-label="Phone" /> : (d.phone ?? "—")}
                  </td>
                  <td className={s.muted}>{d.vehicleLabel ?? "Unassigned"}</td>
                  {canManage && (
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        {editing ? (
                          <>
                            <button className={s.btnPrimary} onClick={() => doSave(d.id)} disabled={pending}>Save</button>
                            <button className={s.btn} onClick={() => setEditId(null)} disabled={pending}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className={s.btn} onClick={() => { setEditId(d.id); setEName(d.name); setEPhone(d.phone ?? ""); }}>Edit</button>
                            <ConfirmButton className={s.btnDanger} title="Delete driver" message={`"${d.name}" will be removed. This can't be undone.`} onConfirm={() => doDelete(d)} disabled={pending}>Delete</ConfirmButton>
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
