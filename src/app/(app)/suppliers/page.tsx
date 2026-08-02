import { redirect } from "next/navigation";
import { getSuppliers } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import { can, canSeeNav } from "@/lib/permissions";
import SupplierAdmin from "./SupplierAdmin";
import s from "@/components/shared.module.css";

export default async function SuppliersPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canSeeNav(user.role, "suppliers")) redirect("/items");
  const suppliers = await getSuppliers();
  const canManage = can(user.role, "supplier.manage");
  return (
    <div className={s.page}>
      <SupplierAdmin suppliers={suppliers} canManage={canManage} />
    </div>
  );
}
