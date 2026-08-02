import Link from "next/link";
import { Plus } from "lucide-react";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getPurchaseOrders, PO_STATUS } from "@/lib/queries";
import { approvePO, receivePO } from "@/app/data-actions";
import Pill from "@/components/Pill";
import { money, date } from "@/lib/format";
import s from "@/components/shared.module.css";

export default async function PurchaseOrdersPage() {
  const user = await getUser();
  const pos = await getPurchaseOrders();
  const canApprove = user ? can(user.role, "po.approve") : false;
  const canReceive = user ? can(user.role, "po.receive") : false;
  const canCreate = user ? can(user.role, "po.create") : false;

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Purchase Orders</h1>
          <p className={s.sub}>Every staff-raised PO needs admin approval — no auto-send</p>
        </div>
        {canCreate && (
          <Link className={s.btnPrimary} href="/purchase-orders/new">
            <Plus size={16} /> New PO
          </Link>
        )}
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>PO</th>
              <th>Supplier</th>
              <th>Items</th>
              <th data-num="true">Total</th>
              <th>Raised by</th>
              <th>Expected</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pos.length === 0 && (
              <tr><td colSpan={8} className={s.muted}>No purchase orders yet.</td></tr>
            )}
            {pos.map((p) => {
              const st = PO_STATUS[p.status] ?? { label: p.status, tone: "neutral" };
              return (
                <tr key={p.id}>
                  <td className={s.name}>{p.code}</td>
                  <td>{p.supplier}</td>
                  <td className={s.muted}>{p.qty} × {p.itemSummary}</td>
                  <td data-num="true" className="tnum">{money(p.total)}</td>
                  <td>{p.createdBy}</td>
                  <td className={s.muted}>{date(p.expectedDate)}</td>
                  <td><Pill tone={st.tone} label={st.label} /></td>
                  <td>
                    {p.status === "pending_approval" && canApprove ? (
                      <form action={approvePO}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className={s.btn} type="submit">Approve</button>
                      </form>
                    ) : p.status === "sent" && canReceive ? (
                      <form action={receivePO}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className={s.btnPrimary} type="submit">Receive</button>
                      </form>
                    ) : (
                      <span className={s.muted}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
