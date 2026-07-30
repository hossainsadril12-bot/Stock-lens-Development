import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getTransferFormData } from "@/lib/queries";
import { createTransfer } from "@/app/data-actions";
import s from "@/components/shared.module.css";

export default async function NewTransferPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!can(user.role, "transfer.create")) redirect("/transfers");
  const { items, hub, subs } = await getTransferFormData();
  const hubId = hub[0]?.id ?? 1;

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

        <div className={s.formGrid}>
          <div className={s.field}>
            <label className={s.label}>From (hub)</label>
            <input className={s.input} value={hub[0]?.name ?? "Main Warehouse"} disabled />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="to_location_id">To sub-warehouse <span className={s.req}>*</span></label>
            <select className={s.select} id="to_location_id" name="to_location_id" required defaultValue="">
              <option value="" disabled>— select destination —</option>
              {subs.map((l) => (
                <option key={l.id} value={l.id}>{l.name}{l.city ? ` (${l.city})` : ""}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={s.formGrid}>
          <div className={s.field}>
            <label className={s.label} htmlFor="vehicle">Vehicle</label>
            <input className={s.input} id="vehicle" name="vehicle" placeholder="Truck DHA-11-2345" />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="expected_date">Expected arrival</label>
            <input className={s.input} id="expected_date" name="expected_date" type="date" />
          </div>
        </div>

        <div className={s.formGrid}>
          <div className={s.field}>
            <label className={s.label} htmlFor="driver_name">Driver name</label>
            <input className={s.input} id="driver_name" name="driver_name" placeholder="Karim Ali" />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="driver_phone">Driver phone</label>
            <input className={s.input} id="driver_phone" name="driver_phone" placeholder="+8801711-000111" />
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
