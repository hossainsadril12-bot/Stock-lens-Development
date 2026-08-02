import { getIndustryKey } from "@/lib/session";
import { getItemsPage, getCategoriesForType } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import ItemsView from "./ItemsView";

export default async function ItemsPage() {
  const key = await getIndustryKey();
  const user = await getUser();
  const { rows, categories, location, locationScoped } = await getItemsPage(key);
  const scannable = key === "physical" || key === "equipment";
  const scanCategories = scannable ? await getCategoriesForType(key) : [];
  const importable = key === "physical" || key === "real_estate";
  return (
    <ItemsView
      industryKey={key}
      rows={rows}
      categories={categories}
      location={location}
      locationScoped={locationScoped}
      canCreate={user ? can(user.role, "item.create") : false}
      canScan={Boolean(user && can(user.role, "stock.move") && scannable)}
      scanCategories={scanCategories}
      canImport={Boolean(user && can(user.role, "item.create") && importable)}
    />
  );
}
