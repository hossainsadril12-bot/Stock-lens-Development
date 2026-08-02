"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addStaff, updateStaff, deleteStaff } from "@/app/data-actions";
import SortHeader from "@/components/SortHeader";
import { useSortable } from "@/components/useSortable";
import ConfirmButton from "@/components/ConfirmButton";
import s from "@/components/shared.module.css";

type Staff = { id: number; name: string; email: string; role: string };

const ROLE_LABEL: Record<string, string> = { admin: "Admin / Owner", staff: "Staff", viewer: "Viewer" };

export default function StaffManager({
  staff,
  canManage,
  currentUserId,
  tabs,
}: {
  staff: Staff[];
  canManage: boolean;
  currentUserId: number;
  tabs?: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [eName, setEName] = useState("");
  const [eRole, setERole] = useState("staff");
  const { sorted, sortKey, dir, toggle } = useSortable(staff, null);

  function doSave(id: number) {
    if (!eName.trim()) return;
    start(async () => { await updateStaff(id, eName, eRole); setEditId(null); router.refresh(); });
  }
  function doDelete(u: Staff) {
    start(async () => { await deleteStaff(u.id); router.refresh(); });
  }

  return (
    <>
      <div className={s.tabRow}>
        <div className={s.tabs}>{tabs}</div>
        {canManage && (
          <button className={s.btnPrimary} onClick={() => setAddOpen((v) => !v)}>
            <Plus size={16} /> {addOpen ? "Close" : "Add employee"}
          </button>
        )}
      </div>

      {canManage && addOpen && (
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Add employee</h3>
          <form action={addStaff} className={s.form}>
            <div className={s.formGrid}>
              <div className={s.field}>
                <label className={s.label} htmlFor="staff_name">Name <span className={s.req}>*</span></label>
                <input className={s.input} id="staff_name" name="name" placeholder="Karim Ali" required />
              </div>
              <div className={s.field}>
                <label className={s.label} htmlFor="staff_email">Email <span className={s.req}>*</span></label>
                <input className={s.input} id="staff_email" name="email" type="email" placeholder="karim@anwarsupplies.com" required />
              </div>
            </div>
            <div className={s.formGrid}>
              <div className={s.field}>
                <label className={s.label} htmlFor="staff_password">Password <span className={s.req}>*</span></label>
                <input className={s.input} id="staff_password" name="password" type="password" placeholder="At least 6 characters" required minLength={6} />
              </div>
              <div className={s.field}>
                <label className={s.label} htmlFor="staff_role">Role</label>
                <select className={s.select} id="staff_role" name="role" defaultValue="staff">
                  <option value="staff">Staff</option>
                  <option value="admin">Admin / Owner</option>
                </select>
              </div>
            </div>
            <div className={s.formActions}>
              <button className={s.btnPrimary} type="submit">Add employee</button>
              <button className={s.btn} type="button" onClick={() => setAddOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <h3 className={s.panelTitle} style={{ marginBottom: 12 }}>Employee information</h3>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <SortHeader label="Name" colKey="name" sortKey={sortKey} dir={dir} onSort={toggle} />
              <SortHeader label="Email" colKey="email" sortKey={sortKey} dir={dir} onSort={toggle} />
              <SortHeader label="Role" colKey="role" sortKey={sortKey} dir={dir} onSort={toggle} />
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 && <tr><td colSpan={canManage ? 4 : 3} className={s.muted}>No staff yet.</td></tr>}
            {sorted.map((u) => {
              const editing = editId === u.id;
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id}>
                  <td className={s.name}>
                    {editing ? <input className={s.input} value={eName} onChange={(e) => setEName(e.target.value)} aria-label="Name" /> : u.name}
                  </td>
                  <td className={s.muted}>{u.email}</td>
                  <td>
                    {editing
                      ? <select className={s.select} value={eRole} onChange={(e) => setERole(e.target.value)} aria-label="Role"><option value="staff">Staff</option><option value="admin">Admin / Owner</option><option value="viewer">Viewer</option></select>
                      : (ROLE_LABEL[u.role] ?? u.role)}
                  </td>
                  {canManage && (
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        {editing ? (
                          <>
                            <button className={s.btnPrimary} onClick={() => doSave(u.id)} disabled={pending}>Save</button>
                            <button className={s.btn} onClick={() => setEditId(null)} disabled={pending}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className={s.btn} onClick={() => { setEditId(u.id); setEName(u.name); setERole(u.role); }}>Edit</button>
                            <ConfirmButton className={s.btnDanger} title="Remove employee" message={`Remove ${u.name} from the team? This can't be undone.`} confirmLabel="Remove" onConfirm={() => doDelete(u)} disabled={pending || isSelf}>Delete</ConfirmButton>
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
