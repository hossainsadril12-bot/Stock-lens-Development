import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getCategoryDetail, getCategoriesForType } from "@/lib/queries";
import { getIndustry } from "@/lib/industries";
import { num } from "@/lib/format";
import StatusPill from "@/components/StatusPill";
import ScanPanel from "@/components/ScanPanel";
import s from "@/components/shared.module.css";

export default async function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const cat = await getCategoryDetail(Number(id));
  if (!cat) notFound();

  const ind = getIndustry(cat.type);
  const canScan = cat.scannable && can(user.role, "stock.move");
  const scanCategories = canScan ? await getCategoriesForType(cat.type) : [];

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <Link href="/categories" className={s.backLink}>
            <ArrowLeft size={14} /> Categories
          </Link>
          <h1 className={s.h1}>{cat.name}</h1>
          <p className={s.sub}>
            {ind.label} · {num(cat.items.length)} item{cat.items.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {canScan ? (
        <ScanPanel categories={scanCategories} defaultCategoryId={cat.id} newItemHref="/items/new" />
      ) : (
        !cat.scannable && (
          <p className={s.sub} style={{ marginBottom: 16 }}>
            This category holds {ind.label.toLowerCase()} — no barcode stock-in here.
          </p>
        )
      )}

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Barcode</th>
              {cat.scannable && <th data-num="true">On hand</th>}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {cat.items.length === 0 ? (
              <tr>
                <td colSpan={cat.scannable ? 4 : 3} className={s.muted}>
                  No items yet. {canScan ? "Scan a barcode above to add one." : ""}
                </td>
              </tr>
            ) : (
              cat.items.map((it) => (
                <tr key={it.id}>
                  <td className={s.name}>
                    <Link href={`/items/${it.id}`}>{it.name}</Link>
                  </td>
                  <td className={s.muted}>{it.barcode ?? "—"}</td>
                  {cat.scannable && (
                    <td data-num="true" className="tnum">{it.onHand != null ? num(it.onHand) : "—"}</td>
                  )}
                  <td><StatusPill industryKey={cat.type} status={it.statusKey} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
