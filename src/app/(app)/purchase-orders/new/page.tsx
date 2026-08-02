import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSuppliers, getItemsPage } from "@/lib/queries";
import { createPO } from "@/app/data-actions";
import s from "@/components/shared.module.css";

export default async function NewPOPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!can(user.role, "po.create")) redirect("/purchase-orders");
  const suppliers = await getSuppliers();
  const itemRows = (await getItemsPage("physical")).rows;

  return (
    <div className={s.page}>
      <div>
        <Link className={s.backLink} href="/purchase-orders">
          <ArrowLeft size={14} /> Back to purchase orders
        </Link>
        <h1 className={s.h1}>New purchase order</h1>
        <p className={s.sub}>Goes to Pending approval — an admin signs off before it&apos;s sent</p>
      </div>

      <form action={createPO} className={s.form}>
        <div className={s.field}>
          <label className={s.label} htmlFor="item_id">Item <span className={s.req}>*</span></label>
          <select className={s.select} id="item_id" name="item_id" defaultValue="" required>
            <option value="" disabled>— select an item —</option>
            {itemRows.map((it) => (
              <option key={it.id} value={it.id}>{it.name}</option>
            ))}
          </select>
        </div>
        <div className={s.formGrid}>
          <div className={s.field}>
            <label className={s.label} htmlFor="qty">Quantity <span className={s.req}>*</span></label>
            <input className={s.input} id="qty" name="qty" type="number" min="1" placeholder="500" required />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="total">Total (৳)</label>
            <input className={s.input} id="total" name="total" type="number" min="0" step="0.01" placeholder="2750" />
          </div>
        </div>
        <div className={s.formGrid}>
          <div className={s.field}>
            <label className={s.label} htmlFor="supplier_id">Supplier</label>
            <select className={s.select} id="supplier_id" name="supplier_id" defaultValue="">
              <option value="">— select —</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>{sup.name}</option>
              ))}
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="expected_date">Expected date</label>
            <input className={s.input} id="expected_date" name="expected_date" type="date" />
          </div>
        </div>
        <div className={s.formActions}>
          <button className={s.btnPrimary} type="submit">Raise for approval</button>
          <Link className={s.btn} href="/purchase-orders">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
