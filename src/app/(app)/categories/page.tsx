import { getCategoriesOverview } from "@/lib/queries";
import { getIndustry } from "@/lib/industries";
import { num } from "@/lib/format";
import s from "@/components/shared.module.css";

export default async function CategoriesPage() {
  const categories = await getCategoriesOverview();
  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Categories</h1>
          <p className={s.sub}>Items are arranged by category with filters, across every industry</p>
        </div>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Industry</th>
              <th data-num="true">Items</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td className={s.name}>{c.name}</td>
                <td className={s.muted}>{getIndustry(c.type).label}</td>
                <td data-num="true" className="tnum">{num(c.itemCount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
