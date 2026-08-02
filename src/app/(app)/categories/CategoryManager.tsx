"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { getIndustry } from "@/lib/industries";
import { addCategory, updateCategory, deleteCategory } from "@/app/data-actions";
import { num } from "@/lib/format";
import SortHeader from "@/components/SortHeader";
import { useSortable } from "@/components/useSortable";
import ConfirmButton from "@/components/ConfirmButton";
import s from "@/components/shared.module.css";

type Cat = { id: number; name: string; type: string; itemCount: number };

export default function CategoryManager({
  categories,
  canManage,
  industryKey,
}: {
  categories: Cat[];
  canManage: boolean;
  industryKey: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [eName, setEName] = useState("");
  const ind = getIndustry(industryKey);
  const { sorted, sortKey, dir, toggle } = useSortable(categories, null, (r, k) =>
    k === "industry" ? getIndustry(r.type).label : (r as Record<string, unknown>)[k]
  );

  function doAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim()) return;
    start(async () => {
      await addCategory(addName, industryKey);
      setAddName(""); setAddOpen(false);
      router.refresh();
    });
  }
  function doSave(id: number) {
    if (!eName.trim()) return;
    start(async () => { await updateCategory(id, eName); setEditId(null); router.refresh(); });
  }
  function delMsg(cat: Cat) {
    return cat.itemCount > 0
      ? `"${cat.name}" has ${cat.itemCount} item(s). They'll become uncategorised. This can't be undone.`
      : `"${cat.name}" will be removed. This can't be undone.`;
  }
  function doDelete(cat: Cat) {
    start(async () => { await deleteCategory(cat.id); router.refresh(); });
  }

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Categories</h1>
          <p className={s.sub}>Open a category to scan barcodes and add stock, or add items manually</p>
        </div>
        {canManage && (
          <button className={s.btnPrimary} onClick={() => setAddOpen((v) => !v)}>
            <Plus size={16} /> {addOpen ? "Close" : "Add category"}
          </button>
        )}
      </div>

      {canManage && addOpen && (
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Add category · {ind.label}</h3>
          <form onSubmit={doAdd} className={s.form}>
            <div className={s.field}>
              <label className={s.label} htmlFor="cat_name">Category name <span className={s.req}>*</span></label>
              <input className={s.input} id="cat_name" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. Paper" required />
            </div>
            <div className={s.formActions}>
              <button className={s.btnPrimary} type="submit" disabled={pending}>Add category</button>
              <button className={s.btn} type="button" onClick={() => setAddOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <SortHeader label="Category" colKey="name" sortKey={sortKey} dir={dir} onSort={toggle} />
              <SortHeader label="Industry" colKey="industry" sortKey={sortKey} dir={dir} onSort={toggle} />
              <SortHeader label="Items" colKey="itemCount" sortKey={sortKey} dir={dir} onSort={toggle} numeric />
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr><td colSpan={canManage ? 4 : 3} className={s.muted}>No categories yet.</td></tr>
            )}
            {sorted.map((c) => {
              const editing = editId === c.id;
              return (
                <tr key={c.id}>
                  <td className={s.name}>
                    {editing
                      ? <input className={s.input} value={eName} onChange={(e) => setEName(e.target.value)} aria-label="Category name" />
                      : <Link href={`/categories/${c.id}`}>{c.name}</Link>}
                  </td>
                  <td className={s.muted}>{getIndustry(c.type).label}</td>
                  <td data-num="true" className="tnum">{num(c.itemCount)}</td>
                  {canManage && (
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        {editing ? (
                          <>
                            <button className={s.btnPrimary} onClick={() => doSave(c.id)} disabled={pending}>Save</button>
                            <button className={s.btn} onClick={() => setEditId(null)} disabled={pending}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className={s.btn} onClick={() => { setEditId(c.id); setEName(c.name); }}>Edit</button>
                            <ConfirmButton className={s.btnDanger} title="Delete category" message={delMsg(c)} onConfirm={() => doDelete(c)} disabled={pending}>Delete</ConfirmButton>
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
