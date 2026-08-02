import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getIndustryKey } from "@/lib/session";
import { getSellableItems } from "@/lib/queries";
import CheckoutRegister from "./CheckoutRegister";
import s from "@/components/shared.module.css";

export default async function CheckoutPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!can(user.role, "stock.move")) redirect("/items");

  const key = await getIndustryKey();
  if (key !== "physical" && key !== "equipment") redirect("/items");

  const catalog = await getSellableItems(key);

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Checkout</h1>
          <p className={s.sub}>Scan or add items, then complete the sale to generate a receipt</p>
        </div>
      </div>
      <CheckoutRegister catalog={catalog} />
    </div>
  );
}
