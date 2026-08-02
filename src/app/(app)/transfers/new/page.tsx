import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getTransferFormData, getTransferRequest } from "@/lib/queries";
import { createTransfer, requestTransfer } from "@/app/data-actions";
import { date } from "@/lib/format";
import s from "@/components/shared.module.css";

export default async function NewTransferPage({
  searchParams,
}: {
  searchParams: Promise<{ request_id?: string; item_id?: string; to_location_id?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const requestId = sp.request_id ? Number(sp.request_id) : null;
  const canApprove = can(user.role, "transfer.approve");
  const canCreate = can(user.role, "transfer.create");
  const canRequest = can(user.role, "transfer.request");

  // Mode 1: accepting a staff request — admin only, prefilled and mostly locked
  if (requestId) {
    if (!canApprove) redirect("/transfers");
    const req = await getTransferRequest(requestId);
    if (!req) redirect("/transfers?tab=requests");
    const { hub, vehicles } = await getTransferFormData();
    const hubId = hub[0]?.id ?? 1;

    return (
      <div className={s.page}>
        <div>
          <Link className={s.backLink} href="/transfers?tab=requests">
            <ArrowLeft size={14} /> Back to requests
          </Link>
          <h1 className={s.h1}>Accept transfer request</h1>
          <p className={s.sub}>
            Requested by {req.requestedBy ?? "—"} on {date(req.requestedAt)} · fill in transport to dispatch
          </p>
        </div>

        <form action={createTransfer} className={s.form}>
          <input type="hidden" name="request_id" value={req.id} />
          <input type="hidden" name="item_id" value={req.itemId ?? ""} />
          <input type="hidden" name="quantity" value={req.quantity} />
          <input type="hidden" name="to_location_id" value={req.toLocationId} />
          <input type="hidden" name="from_location_id" value={hubId} />

          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label}>Item</label>
              <input className={s.input} value={`${req.itemName} × ${req.quantity}`} disabled />
            </div>
            <div className={s.field}>
              <label className={s.label}>To</label>
              <input className={s.input} value={req.toLocationName} disabled />
            </div>
          </div>

          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label}>From (hub)</label>
              <input className={s.input} value={hub[0]?.name ?? "Main Warehouse"} disabled />
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="expected_date">Expected arrival</label>
              <input className={s.input} id="expected_date" name="expected_date" type="date" />
            </div>
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="vehicle_id">Vehicle</label>
            <select className={s.select} id="vehicle_id" name="vehicle_id" defaultValue="">
              <option value="">— no vehicle assigned yet —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.label}{v.driverName ? ` — ${v.driverName}` : " — unassigned driver"}</option>
              ))}
            </select>
          </div>

          <div className={s.formActions}>
            <button className={s.btnPrimary} type="submit">Accept &amp; dispatch</button>
            <Link className={s.btn} href="/transfers?tab=requests">Cancel</Link>
          </div>
        </form>
      </div>
    );
  }

  // Mode 2: staff — request only, no transport details, no direct dispatch
  if (!canCreate) {
    if (!canRequest) redirect("/transfers");
    const { items, subs } = await getTransferFormData();

    return (
      <div className={s.page}>
        <div>
          <Link className={s.backLink} href="/transfers">
            <ArrowLeft size={14} /> Back to transfers
          </Link>
          <h1 className={s.h1}>Request transfer</h1>
          <p className={s.sub}>Ask an Admin to send stock from the hub to your location</p>
        </div>

        <form action={requestTransfer} className={s.form}>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label} htmlFor="item_id">Item <span className={s.req}>*</span></label>
              <select className={s.select} id="item_id" name="item_id" required defaultValue="">
                <option value="" disabled>— select item —</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.name}</option>
                ))}
              </select>
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="quantity">Quantity <span className={s.req}>*</span></label>
              <input className={s.input} id="quantity" name="quantity" type="number" min="1" placeholder="100" required />
            </div>
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="to_location_id">Destination <span className={s.req}>*</span></label>
            <select className={s.select} id="to_location_id" name="to_location_id" required defaultValue="">
              <option value="" disabled>— select destination —</option>
              {subs.map((l) => (
                <option key={l.id} value={l.id}>{l.name}{l.city ? ` (${l.city})` : ""}</option>
              ))}
            </select>
          </div>

          <div className={s.formActions}>
            <button className={s.btnPrimary} type="submit">Send request</button>
            <Link className={s.btn} href="/transfers">Cancel</Link>
          </div>
        </form>
      </div>
    );
  }

  // Mode 3: admin — direct dispatch, optionally prefilled from a low-stock alert link
  const { items, hub, subs, vehicles } = await getTransferFormData();
  const hubId = hub[0]?.id ?? 1;
  const prefillItem = sp.item_id ?? "";
  const prefillTo = sp.to_location_id ?? "";

  return (
    <div className={s.page}>
      <div>
        <Link className={s.backLink} href="/transfers">
          <ArrowLeft size={14} /> Back to transfers
        </Link>
        <h1 className={s.h1}>New transfer</h1>
        <p className={s.sub}>Send stock from the hub to a sub-warehouse on your own transport</p>
      </div>

      <form action={createTransfer} className={s.form}>
        <input type="hidden" name="from_location_id" value={hubId} />

        <div className={s.formGrid}>
          <div className={s.field}>
            <label className={s.label} htmlFor="item_id">Item <span className={s.req}>*</span></label>
            <select className={s.select} id="item_id" name="item_id" required defaultValue={prefillItem}>
              <option value="" disabled>— select item —</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>{it.name}</option>
              ))}
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="quantity">Quantity <span className={s.req}>*</span></label>
            <input className={s.input} id="quantity" name="quantity" type="number" min="1" placeholder="100" required />
          </div>
        </div>

        <div className={s.formGrid}>
          <div className={s.field}>
            <label className={s.label}>From (hub)</label>
            <input className={s.input} value={hub[0]?.name ?? "Main Warehouse"} disabled />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="to_location_id">To sub-warehouse <span className={s.req}>*</span></label>
            <select className={s.select} id="to_location_id" name="to_location_id" required defaultValue={prefillTo}>
              <option value="" disabled>— select destination —</option>
              {subs.map((l) => (
                <option key={l.id} value={l.id}>{l.name}{l.city ? ` (${l.city})` : ""}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={s.formGrid}>
          <div className={s.field}>
            <label className={s.label} htmlFor="vehicle_id">Vehicle</label>
            <select className={s.select} id="vehicle_id" name="vehicle_id" defaultValue="">
              <option value="">— no vehicle assigned yet —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.label}{v.driverName ? ` — ${v.driverName}` : " — unassigned driver"}</option>
              ))}
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="expected_date">Expected arrival</label>
            <input className={s.input} id="expected_date" name="expected_date" type="date" />
          </div>
        </div>

        <div className={s.formActions}>
          <button className={s.btnPrimary} type="submit">Dispatch transfer</button>
          <Link className={s.btn} href="/transfers">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
