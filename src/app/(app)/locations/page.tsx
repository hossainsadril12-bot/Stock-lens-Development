import { getLocationsOverview } from "@/lib/queries";
import { num } from "@/lib/format";
import s from "@/components/shared.module.css";

function roleLabel(l: { kind: string; isHub: boolean; city: string | null }): string {
  if (l.kind === "property") return "Property";
  if (l.isHub) return "Main hub";
  return `Sub-warehouse${l.city ? ` · ${l.city}` : ""}`;
}

export default async function LocationsPage() {
  const locations = await getLocationsOverview();
  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Locations</h1>
          <p className={s.sub}>Main hub, its sub-warehouses by city, and properties</p>
        </div>
      </div>
      <div className={s.grid3}>
        {locations.map((l) => (
          <div key={l.id} className={s.stat}>
            <span className={s.statLabel}>{roleLabel(l)}</span>
            <span className={s.statValue}>{l.name}</span>
            <span className={s.statLabel}>
              {num(l.itemCount)} items · {num(l.onHand)} on hand
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
