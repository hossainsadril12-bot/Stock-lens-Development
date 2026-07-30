import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getTransfers, TRANSFER_STATUS } from "@/lib/queries";
import { receiveTransfer } from "@/app/data-actions";
import Pill from "@/components/Pill";
import { num, date } from "@/lib/format";
import s from "@/components/shared.module.css";

export default async function TransfersPage() {
  const user = await getUser();
  const transfers = await getTransfers();
  const canReceive = user ? can(user.role, "transfer.receive") : false;
  const canCreate = user ? can(user.role, "transfer.create") : false;

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Transfers</h1>
          <p className={s.sub}>Stock sent from the main hub to sub-warehouses on your own transport — no supplier</p>
        </div>
        {canCreate && (
          <Link className={s.btnPrimary} href="/transfers/new">
            <Plus size={16} /> New transfer
          </Link>
        )}
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Transfer</th>
              <th>Item</th>
              <th data-num="true">Qty</th>
              <th>Route</th>
              <th>Transport</th>
              <th>Dispatched</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transfers.length === 0 && (
              <tr><td colSpan={8} className={s.muted}>No transfers yet.</td></tr>
            )}
            {transfers.map((t) => {
              const st = TRANSFER_STATUS[t.status] ?? { label: t.status, tone: "neutral" };
              return (
                <tr key={t.id}>
                  <td className={s.name}>{t.code}</td>
                  <td>{t.itemName}</td>
                  <td data-num="true" className="tnum">{num(t.quantity)}</td>
                  <td className={s.muted}>{t.from} → {t.to}</td>
                  <td>
                    <div>{t.vehicle ?? "—"}</div>
                    <div className={s.muted} style={{ fontSize: "0.75rem" }}>
                      {t.driverName ?? "—"}{t.driverPhone ? ` · ${t.driverPhone}` : ""}
                    </div>
                  </td>
                  <td className={s.muted}>{date(t.dispatchedAt)}</td>
                  <td><Pill tone={st.tone} label={st.label} /></td>
                  <td>
                    {t.status === "in_transit" && canReceive ? (
                      <form action={receiveTransfer}>
                        <input type="hidden" name="id" value={t.id} />
                        <button className={s.btn} type="submit">Receive</button>
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
