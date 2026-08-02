import { getCategoriesOverview } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getIndustryKey } from "@/lib/session";
import CategoryManager from "./CategoryManager";
import s from "@/components/shared.module.css";

export default async function CategoriesPage() {
  const categories = await getCategoriesOverview();
  const user = await getUser();
  const industryKey = await getIndustryKey();
  const canManage = user ? can(user.role, "item.create") : false;
  return (
    <div className={s.page}>
      <CategoryManager categories={categories} canManage={canManage} industryKey={industryKey} />
    </div>
  );
}
