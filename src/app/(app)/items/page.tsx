import { getIndustryKey } from "@/lib/session";
import { getItemsPage } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import ItemsView from "./ItemsView";

export default async function ItemsPage() {
  const key = await getIndustryKey();
  const user = await getUser();
  const { rows, categories, location, locationScoped } = await getItemsPage(key);
  return (
    <ItemsView
      industryKey={key}
      rows={rows}
      categories={categories}
      location={location}
      locationScoped={locationScoped}
      canCreate={user ? can(user.role, "item.create") : false}
    />
  );
}
