import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getIndustryKey } from "@/lib/session";
import { getCategoriesForType } from "@/lib/queries";
import { getIndustry } from "@/lib/industries";
import ItemForm from "../ItemForm";
import s from "@/components/shared.module.css";

export default async function NewItemPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!can(user.role, "item.create")) redirect("/items");

  const key = await getIndustryKey();
  const categories = await getCategoriesForType(key);
  const ind = getIndustry(key);

  return (
    <div className={s.page}>
      <div>
        <Link className={s.backLink} href="/items">
          <ArrowLeft size={14} /> Back to items
        </Link>
        <h1 className={s.h1}>Add {ind.noun.replace(/s$/, "")}</h1>
        <p className={s.sub}>{ind.label} · required fields adapt to this type</p>
      </div>
      <ItemForm mode="new" industryKey={key} categories={categories} />
    </div>
  );
}
