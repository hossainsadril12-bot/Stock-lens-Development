import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, Plus, Minus } from "lucide-react";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getItem, getItemMovements } from "@/lib/queries";
import { getIndustry } from "@/lib/industries";
import { deleteItem, stockMove } from "@/app/data-actions";
import StatusPill from "@/components/StatusPill";
import { num, money, date } from "@/lib/format";
import s from "@/components/shared.module.css";
import d from "./detail.module.css";

const ATTR_LABELS: Record<string, string> = {
  block: "Block", floor: "Floor", bedrooms: "Bedrooms", bathrooms: "Bathrooms",
  area_sqft: "Area (sqft)", facing: "Facing", furnished: "Furnished",
  unit_of_measure: "Unit of measure", tracking_mode: "Tracking mode",
  serial_number: "Serial number", condition: "Condition", assigned_to: "Assigned to", last_serviced: "Last serviced",
  seats: "Seats", seats_used: "Seats used", expiry_date: "Expiry date", vendor_url: "Vendor",
  components: "Components",
};

function fmtAttr(key: string, v: unknown): string {
  if (v == null || v === "") return "—";
  if (key === "furnished") return v ? "Yes" : "No";
  if (key === "components" && Array.isArray(v)) return v.join(", ");
  if (key === "expiry_date" || key === "last_serviced") return date(String(v));
  if (key === "area_sqft" || key === "seats" || key === "seats_used") return num(Number(v));
  return String(v);
}

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const item = await getItem(Number(id));
  if (!item) notFound();

  const ind = getIndustry(item.type);
  const hasStock = item.type === "physical" || item.type === "equipment";
  const movements = hasStock ? await getItemMovements(item.id) : [];
  const canEdit = can(user.role, "item.edit");
  const canDelete = can(user.role, "item.delete");
  const canMove = can(user.role, "stock.move") && item.type === "physical";

  const attrEntries = Object.entries(item.attrs).filter(([k]) => ATTR_LABELS[k]);

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <Link className={s.backLink} href="/items">
            <ArrowLeft size={14} /> Back to items
          </Link>
          <h1 className={s.h1}>{item.name}</h1>
          <p className={s.sub}>
            {item.sku && <span>{item.sku} · </span>}
            {item.categoryName && <span>{item.categoryName} · </span>}
            <StatusPill industryKey={item.type} status={item.statusKey} />
          </p>
        </div>
        <div className={s.actions}>
          {canEdit ? (
            <Link className={s.btn} href={`/items/${item.id}/edit`}>
              <Pencil size={15} /> Edit
            </Link>
          ) : (
            <span className={s.readonly}>Read-only</span>
          )}
          {canDelete && (
            <form action={deleteItem}>
              <input type="hidden" name="id" value={item.id} />
              <button className={s.btnDanger} type="submit">
                <Trash2 size={15} /> Delete
              </button>
            </form>
          )}
        </div>
      </div>

      {hasStock && (
        <div className={s.grid3}>
          <div className={s.stat}>
            <span className={s.statLabel}>Available</span>
            <span className={`${s.statValue} tnum`}>{num(item.totals.available)}</span>
          </div>
          <div className={s.stat}>
            <span className={s.statLabel}>On hand</span>
            <span className={`${s.statValue} tnum ${d.dim}`}>{num(item.totals.onHand)}</span>
          </div>
          <div className={s.stat}>
            <span className={s.statLabel}>Reserved</span>
            <span className={`${s.statValue} tnum ${d.dim}`}>{num(item.totals.reserved)}</span>
          </div>
        </div>
      )}

      <div className={s.grid2}>
        {hasStock && (
          <div className={s.panel}>
            <h3 className={s.panelTitle}>Stock by location</h3>
            <table className={s.table}>
              <thead>
                <tr><th>Location</th><th data-num="true">On hand</th><th data-num="true">Reserved</th><th data-num="true">Available</th></tr>
              </thead>
              <tbody>
                {item.stockByLocation.length === 0 && (
                  <tr><td colSpan={4} className={s.muted}>No stock recorded.</td></tr>
                )}
                {item.stockByLocation.map((r) => (
                  <tr key={r.location}>
                    <td className={s.name}>{r.location}</td>
                    <td data-num="true" className="tnum">{num(r.onHand)}</td>
                    <td data-num="true" className="tnum">{num(r.reserved)}</td>
                    <td data-num="true" className="tnum">{num(r.available)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={s.panel}>
          <h3 className={s.panelTitle}>Details</h3>
          <div className={s.kv}>
            <span className={s.kvKey}>Type</span>
            <span className={s.kvVal}>{ind.label}</span>
            {item.price != null && (
              <>
                <span className={s.kvKey}>Price</span>
                <span className={s.kvVal}>{money(item.price)}</span>
              </>
            )}
            {item.reorderPoint != null && (
              <>
                <span className={s.kvKey}>Reorder point</span>
                <span className={s.kvVal}>{num(item.reorderPoint)}</span>
              </>
            )}
            {attrEntries.map(([k, v]) => (
              <div key={k} className={d.kvRow}>
                <span className={s.kvKey}>{ATTR_LABELS[k]}</span>
                <span className={s.kvVal}>{fmtAttr(k, v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {canMove && (
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Record stock movement (scan)</h3>
          <div className={d.moveRow}>
            <form action={stockMove} className={d.moveForm}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="kind" value="in" />
              <input className={s.input} name="qty" type="number" min="1" placeholder="Qty" required />
              <button className={s.btnPrimary} type="submit"><Plus size={15} /> Stock in</button>
            </form>
            <form action={stockMove} className={d.moveForm}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="kind" value="out" />
              <input className={s.input} name="qty" type="number" min="1" placeholder="Qty" required />
              <button className={s.btn} type="submit"><Minus size={15} /> Stock out</button>
            </form>
          </div>
        </div>
      )}

      {hasStock && (
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Movement history</h3>
          <table className={s.table}>
            <thead>
              <tr><th>Type</th><th data-num="true">Qty</th><th>Note</th><th>Location</th><th>Date</th></tr>
            </thead>
            <tbody>
              {movements.length === 0 && (
                <tr><td colSpan={5} className={s.muted}>No movements yet.</td></tr>
              )}
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className={s.name}>{m.type.replace(/_/g, " ")}</td>
                  <td data-num="true" className="tnum">{num(m.quantity)}</td>
                  <td className={s.muted}>{m.note ?? "—"}</td>
                  <td>{m.location}</td>
                  <td className={s.muted}>{date(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
