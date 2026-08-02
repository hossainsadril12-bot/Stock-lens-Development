import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getItem, getCategoriesForType } from "@/lib/queries";
import ItemForm from "../../ItemForm";
import s from "@/components/shared.module.css";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!can(user.role, "item.edit")) redirect("/items");

  const { id } = await params;
  const item = await getItem(Number(id));
  if (!item) notFound();
  const categories = await getCategoriesForType(item.type);

  return (
    <div className={s.page}>
      <div>
        <Link className={s.backLink} href={`/items/${item.id}`}>
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 className={s.h1}>Edit {item.name}</h1>
        <p className={s.sub}>Update the fields for this item</p>
      </div>
      <ItemForm mode="edit" industryKey={item.type} categories={categories} item={item} />
    </div>
  );
}
