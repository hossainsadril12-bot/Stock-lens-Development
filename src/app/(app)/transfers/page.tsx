import Link from "next/link";
import { Plus, Check, X } from "lucide-react";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getTransfers, TRANSFER_STATUS } from "@/lib/queries";
import { receiveTransfer, rejectTransferRequest } from "@/app/data-actions";
import Pill from "@/components/Pill";
import NotifyButton from "@/components/NotifyButton";
import { num, date } from "@/lib/format";
import s from "@/components/shared.module.css";

const TABS = [
  { key: "all", label: "All", statuses: ["requested", "in_transit", "received", "rejected"] },
  { key: "requests", label: "Requests", statuses: ["requested"] },
  { key: "in_transit", label: "In transit", statuses: ["in_transit"] },
  { key: "received", label: "Received", statuses: ["received"] },
  { key: "rejected", label: "Rejected", statuses: ["rejected"] },
] as const;

export default async function TransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getUser();
  const sp = await searchParams;
  const transfers = await getTransfers();
  const canReceive = user ? can(user.role, "transfer.receive") : false;
  const canCreate = user ? can(user.role, "transfer.create") : false;
  const canRequest = user ? can(user.role, "transfer.request") : false;
  const canApprove = user ? can(user.role, "transfer.approve") : false;
  const canNotify = user ? can(user.role, "transfer.notify") : false;

  const activeTab = TABS.find((t) => t.key === sp.tab) ?? TABS[0];
  const requestCount = transfers.filter((t) => t.status === "requested").length;
  const rows = transfers.filter((t) => (activeTab.statuses as readonly string[]).includes(t.status));

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
        {!canCreate && canRequest && (
          <Link className={s.btnPrimary} href="/transfers/new">
            <Plus size={16} /> Request transfer
          </Link>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/transfers?tab=${t.key}`}
            className={t.key === activeTab.key ? s.btnPrimary : s.btn}
          >
            {t.label}
            {t.key === "requests" && requestCount > 0 ? ` (${requestCount})` : ""}
          </Link>
        ))}
      </div>

      {activeTab.key === "requests" ? (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th data-num="true">Qty</th>
                <th>Warehouse</th>
                <th>Staff</th>
                <th>Requested</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className={s.muted}>No transfer requests.</td></tr>
              )}
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className={s.name}>{t.itemName}</td>
                  <td data-num="true" className="tnum">{num(t.quantity)}</td>
                  <td className={s.muted}>{t.to}</td>
                  <td>{t.requestedBy ?? "—"}</td>
                  <td className={s.muted}>{date(t.requestedAt)}</td>
                  <td><Pill tone="neutral" label="Requested" /></td>
                  <td>
                    {canApprove ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <Link className={s.btn} href={`/transfers/new?request_id=${t.id}`}>
                          <Check size={14} /> Accept
                        </Link>
                        <form action={rejectTransferRequest}>
                          <input type="hidden" name="id" value={t.id} />
                          <button className={s.btn} type="submit"><X size={14} /> Cancel</button>
                        </form>
                      </div>
                    ) : (
                      <span className={s.muted}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Transfer</th>
                <th>Item</th>
                <th data-num="true">Qty</th>
                <th>Route</th>
                <th>Transport</th>
                <th>Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} className={s.muted}>No transfers here.</td></tr>
              )}
              {rows.map((t) => {
                const st = TRANSFER_STATUS[t.status] ?? { label: t.status, tone: "neutral" };
                return (
                  <tr key={t.id}>
                    <td className={s.name}>{t.code}</td>
                    <td>{t.itemName}</td>
                    <td data-num="true" className="tnum">{num(t.quantity)}</td>
                    <td className={s.muted}>{t.from} → {t.to}</td>
                    <td>
                      {t.vehicle ? (
                        <>
                          <div>{t.vehicle}</div>
                          <div className={s.muted} style={{ fontSize: "0.75rem" }}>
                            {t.driverName ?? "—"}{t.driverPhone ? ` · ${t.driverPhone}` : ""}
                          </div>
                        </>
                      ) : (
                        <span className={s.muted}>{t.status === "requested" ? "Awaiting dispatch" : "—"}</span>
                      )}
                    </td>
                    <td className={s.muted}>
                      {t.status === "requested" ? date(t.requestedAt) : t.dispatchedAt ? date(t.dispatchedAt) : t.rejectedAt ? date(t.rejectedAt) : "—"}
                    </td>
                    <td><Pill tone={st.tone} label={st.label} /></td>
                    <td>
                      {t.status === "requested" ? (
                        <span className={s.muted}>—</span>
                      ) : t.status === "in_transit" ? (
                        canReceive ? (
                          <form action={receiveTransfer} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input type="hidden" name="id" value={t.id} />
                            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem" }} className={s.muted}>
                              <input type="checkbox" required /> All items scanned
                            </label>
                            <button className={s.btn} type="submit">Received</button>
                          </form>
                        ) : canNotify ? (
                          <NotifyButton code={t.code} destination={t.to} />
                        ) : (
                          <span className={s.muted}>—</span>
                        )
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
      )}
    </div>
  );
}
