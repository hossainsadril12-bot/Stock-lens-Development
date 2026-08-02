import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getVehicles, getDrivers } from "@/lib/queries";
import { addVehicle, assignVehicleDriver } from "@/app/data-actions";
import s from "@/components/shared.module.css";

export default async function TransportPage() {
  const user = await getUser();
  const canManage = user ? can(user.role, "team.manage") : false;
  const vehicles = await getVehicles();
  const drivers = await getDrivers();

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Transport</h1>
          <p className={s.sub}>Own fleet used to dispatch transfers — vehicle and its assigned driver</p>
        </div>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr><th>Vehicle</th><th>Assigned driver</th>{canManage && <th></th>}</tr>
          </thead>
          <tbody>
            {vehicles.length === 0 && (
              <tr><td colSpan={canManage ? 3 : 2} className={s.muted}>No vehicles yet.</td></tr>
            )}
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td className={s.name}>{v.label}</td>
                <td className={s.muted}>
                  {v.driverName ? `${v.driverName}${v.driverPhone ? ` · ${v.driverPhone}` : ""}` : "Unassigned"}
                </td>
                {canManage && (
                  <td>
                    <form action={assignVehicleDriver} style={{ display: "flex", gap: 8 }}>
                      <input type="hidden" name="id" value={v.id} />
                      <select className={s.select} name="driver_id" defaultValue={v.driverId ?? ""}>
                        <option value="">— unassign —</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <button className={s.btn} type="submit">Save</button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManage && (
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Add vehicle</h3>
          <form action={addVehicle} className={s.form}>
            <div className={s.formGrid}>
              <div className={s.field}>
                <label className={s.label} htmlFor="label">Vehicle <span className={s.req}>*</span></label>
                <input className={s.input} id="label" name="label" placeholder="Truck DHA-11-2345" required />
              </div>
              <div className={s.field}>
                <label className={s.label} htmlFor="driver_id">Assign driver</label>
                <select className={s.select} id="driver_id" name="driver_id" defaultValue="">
                  <option value="">— unassigned —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={s.formActions}>
              <button className={s.btnPrimary} type="submit">Add vehicle</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
