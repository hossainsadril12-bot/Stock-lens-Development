import { getSuppliers } from "@/lib/queries";
import { num } from "@/lib/format";
import s from "@/components/shared.module.css";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();
  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Suppliers</h1>
          <p className={s.sub}>Contacts and lead times that feed the reorder forecast</p>
        </div>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Supplier</th>
              <th data-num="true">Lead time (days)</th>
              <th data-num="true">Open POs</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((sup) => (
              <tr key={sup.id}>
                <td className={s.name}>{sup.name}</td>
                <td data-num="true" className="tnum">{num(sup.leadTimeDays)}</td>
                <td data-num="true" className="tnum">{num(sup.openPOs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
