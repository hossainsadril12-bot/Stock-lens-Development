"use client";

import Link from "next/link";
import { getIndustry } from "@/lib/industries";
import { createItem, updateItem } from "@/app/data-actions";
import type { ItemDetail } from "@/lib/queries";
import s from "@/components/shared.module.css";

type Cat = { id: number; name: string };

export default function ItemForm({
  mode,
  industryKey,
  categories,
  item,
}: {
  mode: "new" | "edit";
  industryKey: string;
  categories: Cat[];
  item?: ItemDetail;
}) {
  const ind = getIndustry(industryKey);
  const a = item?.attrs ?? {};
  const statusOptions = Object.entries(ind.statuses);

  const Category = (
    <div className={s.field}>
      <label className={s.label} htmlFor="category_id">Category</label>
      <select className={s.select} id="category_id" name="category_id" defaultValue={item?.categoryId ?? ""}>
        <option value="">— none —</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );

  const Status = (
    <div className={s.field}>
      <label className={s.label} htmlFor="status">Status <span className={s.req}>*</span></label>
      <select className={s.select} id="status" name="status" defaultValue={item?.statusKey ?? statusOptions[0]?.[0]}>
        {statusOptions.map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <form action={mode === "new" ? createItem : updateItem} className={s.form}>
      <input type="hidden" name="type" value={industryKey} />
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className={s.field}>
        <label className={s.label} htmlFor="name">
          {ind.key === "real_estate" ? "Unit name" : "Name"} <span className={s.req}>*</span>
        </label>
        <input className={s.input} id="name" name="name" defaultValue={item?.name ?? ""} placeholder="e.g. A4 Premium Paper" required />
      </div>

      {ind.key === "physical" && (
        <>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label} htmlFor="sku">SKU</label>
              <input className={s.input} id="sku" name="sku" defaultValue={item?.sku ?? ""} placeholder="PAP-A4-PRM" />
            </div>
            {Category}
          </div>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label} htmlFor="quantity">
                {mode === "new" ? "Opening quantity" : "Quantity (manage via stock moves)"} {mode === "new" && <span className={s.req}>*</span>}
              </label>
              <input className={s.input} id="quantity" name="quantity" type="number" min="0" defaultValue={mode === "new" ? "0" : item?.totals.onHand ?? 0} disabled={mode === "edit"} />
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="reorder_point">Reorder point</label>
              <input className={s.input} id="reorder_point" name="reorder_point" type="number" min="0" defaultValue={item?.reorderPoint ?? ""} placeholder="200" />
            </div>
          </div>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label} htmlFor="unit_of_measure">Unit of measure</label>
              <input className={s.input} id="unit_of_measure" name="unit_of_measure" defaultValue={a.unit_of_measure ?? "unit"} />
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="tracking_mode">Tracking mode</label>
              <select className={s.select} id="tracking_mode" name="tracking_mode" defaultValue={a.tracking_mode ?? "none"}>
                <option value="none">None</option>
                <option value="batch">Batch / expiry</option>
                <option value="serial">Serial</option>
              </select>
            </div>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="price">Unit price (৳)</label>
            <input className={s.input} id="price" name="price" type="number" step="0.01" min="0" defaultValue={item?.price ?? ""} />
          </div>
        </>
      )}

      {ind.key === "real_estate" && (
        <>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label} htmlFor="block">Block</label>
              <input className={s.input} id="block" name="block" defaultValue={a.block ?? "A"} />
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="floor">Floor</label>
              <input className={s.input} id="floor" name="floor" type="number" min="0" defaultValue={a.floor ?? ""} />
            </div>
          </div>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label} htmlFor="bedrooms">Bedrooms</label>
              <input className={s.input} id="bedrooms" name="bedrooms" type="number" min="0" defaultValue={a.bedrooms ?? ""} />
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="area_sqft">Area (sqft)</label>
              <input className={s.input} id="area_sqft" name="area_sqft" type="number" min="0" defaultValue={a.area_sqft ?? ""} />
            </div>
          </div>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label} htmlFor="price">Price (৳)</label>
              <input className={s.input} id="price" name="price" type="number" min="0" defaultValue={item?.price ?? ""} />
            </div>
            {Status}
          </div>
          <label className={s.checkbox}>
            <input type="checkbox" name="furnished" defaultChecked={Boolean(a.furnished)} /> Furnished
          </label>
        </>
      )}

      {ind.key === "equipment" && (
        <>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label} htmlFor="sku">Asset tag</label>
              <input className={s.input} id="sku" name="sku" defaultValue={item?.sku ?? ""} placeholder="EQ-FL-01" />
            </div>
            {Category}
          </div>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label} htmlFor="condition">Condition</label>
              <input className={s.input} id="condition" name="condition" defaultValue={a.condition ?? "good"} />
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="assigned_to">Assigned to</label>
              <input className={s.input} id="assigned_to" name="assigned_to" defaultValue={a.assigned_to ?? ""} placeholder="Unassigned" />
            </div>
          </div>
          {Status}
        </>
      )}

      {ind.key === "digital" && (
        <>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label} htmlFor="seats">Seats</label>
              <input className={s.input} id="seats" name="seats" type="number" min="0" defaultValue={a.seats ?? ""} />
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="seats_used">Seats used</label>
              <input className={s.input} id="seats_used" name="seats_used" type="number" min="0" defaultValue={a.seats_used ?? 0} />
            </div>
          </div>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label} htmlFor="expiry_date">Expiry date</label>
              <input className={s.input} id="expiry_date" name="expiry_date" type="date" defaultValue={a.expiry_date ?? ""} />
            </div>
            {Status}
          </div>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label} htmlFor="price">Annual price (৳)</label>
              <input className={s.input} id="price" name="price" type="number" min="0" defaultValue={item?.price ?? ""} />
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="vendor_url">Vendor URL</label>
              <input className={s.input} id="vendor_url" name="vendor_url" defaultValue={a.vendor_url ?? ""} />
            </div>
          </div>
        </>
      )}

      {ind.key === "kit" && (
        <>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label} htmlFor="sku">SKU</label>
              <input className={s.input} id="sku" name="sku" defaultValue={item?.sku ?? ""} placeholder="KIT-OFFICE" />
            </div>
            {Status}
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="components">Components (comma-separated)</label>
            <textarea className={s.textarea} id="components" name="components" defaultValue={(a.components ?? []).join(", ")} placeholder="A4 Premium Paper x2, Black Ink x1" />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="price">Price (৳)</label>
            <input className={s.input} id="price" name="price" type="number" min="0" defaultValue={item?.price ?? ""} />
          </div>
        </>
      )}

      <div className={s.formActions}>
        <button className={s.btnPrimary} type="submit">
          {mode === "new" ? "Create item" : "Save changes"}
        </button>
        <Link className={s.btn} href={item ? `/items/${item.id}` : "/items"}>Cancel</Link>
      </div>
    </form>
  );
}
