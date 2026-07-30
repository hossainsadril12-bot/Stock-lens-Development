"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { items, stock, movements, purchaseOrders, transferOrders } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { can, type Action } from "@/lib/permissions";
import type { IndustryKey } from "@/lib/industries";

const OWN_LOC = 1;

async function guard(action: Action) {
  const u = await getUser();
  if (!u) redirect("/login");
  if (!can(u.role, action)) redirect("/items"); // silent block; UI already hides the control
  return u;
}

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const n = (fd: FormData, k: string) => {
  const v = s(fd, k);
  return v === "" ? null : Number(v);
};

function buildAttrs(type: IndustryKey, fd: FormData): Record<string, unknown> {
  switch (type) {
    case "physical":
      return { unit_of_measure: s(fd, "unit_of_measure") || "unit", tracking_mode: s(fd, "tracking_mode") || "none" };
    case "real_estate":
      return {
        block: s(fd, "block") || "A",
        floor: n(fd, "floor"),
        bedrooms: n(fd, "bedrooms"),
        bathrooms: n(fd, "bedrooms"),
        area_sqft: n(fd, "area_sqft"),
        furnished: fd.get("furnished") === "on",
      };
    case "equipment":
      return { serial_number: s(fd, "sku"), condition: s(fd, "condition") || "good", assigned_to: s(fd, "assigned_to") || null };
    case "digital":
      return { seats: n(fd, "seats"), seats_used: n(fd, "seats_used") ?? 0, expiry_date: s(fd, "expiry_date") || null, vendor_url: s(fd, "vendor_url") || null };
    case "kit":
      return { components: s(fd, "components").split(",").map((c) => c.trim()).filter(Boolean) };
  }
}

function statusFor(type: IndustryKey, fd: FormData): string | null {
  if (type === "physical") return null; // derived
  return s(fd, "status") || null;
}

export async function createItem(fd: FormData) {
  await guard("item.create");
  const type = s(fd, "type") as IndustryKey;
  const name = s(fd, "name");
  if (!name) redirect("/items/new");

  const [row] = await db
    .insert(items)
    .values({
      type,
      name,
      sku: s(fd, "sku") || null,
      categoryId: n(fd, "category_id"),
      status: statusFor(type, fd),
      price: n(fd, "price"),
      reorderPoint: type === "physical" ? n(fd, "reorder_point") : null,
      primaryLocationId: type === "real_estate" ? 2 : OWN_LOC,
      attrs: JSON.stringify(buildAttrs(type, fd)),
      createdAt: new Date().toISOString(),
    })
    .returning({ id: items.id });

  if (type === "physical" || type === "equipment") {
    const qty = n(fd, "quantity") ?? 0;
    await db.insert(stock).values({ itemId: row.id, locationId: OWN_LOC, onHand: qty, reserved: 0 });
    if (qty > 0)
      await db.insert(movements).values({ itemId: row.id, locationId: OWN_LOC, type: "stock_in", quantity: qty, note: "Opening stock", createdAt: new Date().toISOString() });
  }

  revalidatePath("/items");
  redirect(`/items/${row.id}`);
}

export async function updateItem(fd: FormData) {
  await guard("item.edit");
  const id = Number(s(fd, "id"));
  const type = s(fd, "type") as IndustryKey;
  await db
    .update(items)
    .set({
      name: s(fd, "name"),
      sku: s(fd, "sku") || null,
      categoryId: n(fd, "category_id"),
      status: statusFor(type, fd),
      price: n(fd, "price"),
      reorderPoint: type === "physical" ? n(fd, "reorder_point") : null,
      attrs: JSON.stringify(buildAttrs(type, fd)),
    })
    .where(eq(items.id, id));
  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  redirect(`/items/${id}`);
}

export async function deleteItem(fd: FormData) {
  await guard("item.delete");
  const id = Number(s(fd, "id"));
  await db.delete(stock).where(eq(stock.itemId, id));
  await db.delete(movements).where(eq(movements.itemId, id));
  await db.delete(items).where(eq(items.id, id));
  revalidatePath("/items");
  redirect("/items");
}

export async function stockMove(fd: FormData) {
  await guard("stock.move");
  const id = Number(s(fd, "id"));
  const kind = s(fd, "kind"); // in | out
  const qty = Math.max(0, Number(s(fd, "qty")) || 0);
  if (!qty) redirect(`/items/${id}`);

  const rows = await db.select().from(stock).where(and(eq(stock.itemId, id), eq(stock.locationId, OWN_LOC)));
  const current = rows[0];
  const delta = kind === "out" ? -qty : qty;
  if (current) {
    await db.update(stock).set({ onHand: Math.max(0, current.onHand + delta) }).where(eq(stock.id, current.id));
  } else {
    await db.insert(stock).values({ itemId: id, locationId: OWN_LOC, onHand: Math.max(0, delta), reserved: 0 });
  }
  await db.insert(movements).values({
    itemId: id,
    locationId: OWN_LOC,
    type: kind === "out" ? "stock_out" : "stock_in",
    quantity: qty,
    note: kind === "out" ? "Stock out (scan)" : "Stock in (scan)",
    createdAt: new Date().toISOString(),
  });
  revalidatePath(`/items/${id}`);
  revalidatePath("/items");
  redirect(`/items/${id}`);
}

export async function createPO(fd: FormData) {
  const u = await guard("po.create");
  const count = (await db.select().from(purchaseOrders)).length;
  const code = `PO-${1043 + count}`;
  const qty = Number(s(fd, "qty")) || 0;
  const total = Number(s(fd, "total")) || 0;
  await db.insert(purchaseOrders).values({
    code,
    supplierId: n(fd, "supplier_id"),
    status: "pending_approval", // every staff/admin PO needs sign-off (Q12)
    total,
    itemSummary: s(fd, "item_summary"),
    qty,
    createdBy: u.name.split(" ")[0],
    createdAt: new Date().toISOString(),
    expectedDate: s(fd, "expected_date") || null,
  });
  revalidatePath("/purchase-orders");
  redirect("/purchase-orders");
}

export async function approvePO(fd: FormData) {
  await guard("po.approve");
  const id = Number(s(fd, "id"));
  await db.update(purchaseOrders).set({ status: "sent" }).where(eq(purchaseOrders.id, id));
  revalidatePath("/purchase-orders");
  revalidatePath("/dashboard");
  redirect("/purchase-orders");
}

export async function createTransfer(fd: FormData) {
  const u = await guard("transfer.create");
  const itemId = n(fd, "item_id");
  const qty = Math.max(0, Number(s(fd, "quantity")) || 0);
  const from = n(fd, "from_location_id") ?? OWN_LOC;
  const to = n(fd, "to_location_id");
  if (!itemId || !qty || !to) redirect("/transfers/new");

  const it = (await db.select().from(items).where(eq(items.id, itemId)))[0];
  const count = (await db.select().from(transferOrders)).length;
  const code = `TR-${2002 + count}`;
  const now = new Date().toISOString();

  // deduct from the source hub (goes in transit)
  const src = (await db.select().from(stock).where(and(eq(stock.itemId, itemId), eq(stock.locationId, from))))[0];
  if (src) await db.update(stock).set({ onHand: Math.max(0, src.onHand - qty) }).where(eq(stock.id, src.id));
  await db.insert(movements).values({ itemId, locationId: from, type: "transfer", quantity: qty, note: `Transfer ${code} dispatched`, createdAt: now });

  await db.insert(transferOrders).values({
    code,
    itemId,
    itemName: it?.name ?? "Item",
    quantity: qty,
    fromLocationId: from,
    toLocationId: to,
    status: "in_transit",
    vehicle: s(fd, "vehicle") || null,
    driverName: s(fd, "driver_name") || null,
    driverPhone: s(fd, "driver_phone") || null,
    dispatchedAt: now,
    expectedDate: s(fd, "expected_date") || null,
    receivedAt: null,
    createdBy: u.name.split(" ")[0],
  });

  revalidatePath("/transfers");
  revalidatePath("/items");
  redirect("/transfers");
}

export async function receiveTransfer(fd: FormData) {
  await guard("transfer.receive");
  const id = Number(s(fd, "id"));
  const t = (await db.select().from(transferOrders).where(eq(transferOrders.id, id)))[0];
  if (!t || t.status === "received") redirect("/transfers");

  const now = new Date().toISOString();
  if (t.itemId != null) {
    const dest = (await db.select().from(stock).where(and(eq(stock.itemId, t.itemId), eq(stock.locationId, t.toLocationId))))[0];
    if (dest) await db.update(stock).set({ onHand: dest.onHand + t.quantity }).where(eq(stock.id, dest.id));
    else await db.insert(stock).values({ itemId: t.itemId, locationId: t.toLocationId, onHand: t.quantity, reserved: 0 });
    await db.insert(movements).values({ itemId: t.itemId, locationId: t.toLocationId, type: "transfer", quantity: t.quantity, note: `Transfer ${t.code} received`, createdAt: now });
  }
  await db.update(transferOrders).set({ status: "received", receivedAt: now }).where(eq(transferOrders.id, id));

  revalidatePath("/transfers");
  revalidatePath("/items");
  redirect("/transfers");
}
