"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { items, stock, movements, purchaseOrders, transferOrders, drivers, vehicles, users, suppliers, categories, notifications, sales, saleItems, feedback } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { can, type Action } from "@/lib/permissions";
import type { IndustryKey } from "@/lib/industries";
import { getIndustry } from "@/lib/industries";
import type { ImportType, ParsedRow } from "@/lib/csv-import";

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
      barcode: s(fd, "barcode") || null,
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
      barcode: s(fd, "barcode") || null,
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

// Scan-driven stock-in. Called programmatically from the ScanPanel client component.
// Known barcode -> +1 on hand at own location. Unknown -> caller offers create.
export type ScanResult =
  | { ok: true; itemId: number; name: string; onHand: number }
  | { ok: false; reason: "empty" | "unknown"; barcode: string };

export async function scanStockIn(barcode: string): Promise<ScanResult> {
  await guard("stock.move");
  const code = String(barcode ?? "").trim();
  if (!code) return { ok: false, reason: "empty", barcode: "" };

  const [it] = await db.select().from(items).where(eq(items.barcode, code));
  if (!it) return { ok: false, reason: "unknown", barcode: code };

  const rows = await db.select().from(stock).where(and(eq(stock.itemId, it.id), eq(stock.locationId, OWN_LOC)));
  const current = rows[0];
  const newOnHand = (current?.onHand ?? 0) + 1;
  if (current) {
    await db.update(stock).set({ onHand: newOnHand }).where(eq(stock.id, current.id));
  } else {
    await db.insert(stock).values({ itemId: it.id, locationId: OWN_LOC, onHand: 1, reserved: 0 });
  }
  await db.insert(movements).values({
    itemId: it.id,
    locationId: OWN_LOC,
    type: "stock_in",
    quantity: 1,
    note: "Stock in (barcode scan)",
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/items");
  revalidatePath(`/items/${it.id}`);
  return { ok: true, itemId: it.id, name: it.name, onHand: newOnHand };
}

export async function createPO(fd: FormData) {
  const u = await guard("po.create");
  const count = (await db.select().from(purchaseOrders)).length;
  const code = `PO-${1043 + count}`;
  const qty = Number(s(fd, "qty")) || 0;
  const total = Number(s(fd, "total")) || 0;
  const itemId = n(fd, "item_id");
  // Item summary snapshots the linked item's name for display.
  const it = itemId != null ? (await db.select().from(items).where(eq(items.id, itemId)))[0] : null;
  await db.insert(purchaseOrders).values({
    code,
    supplierId: n(fd, "supplier_id"),
    status: "pending_approval", // every staff/admin PO needs sign-off (Q12)
    total,
    itemId,
    itemSummary: it?.name ?? s(fd, "item_summary"),
    qty,
    createdBy: u.name.split(" ")[0],
    createdAt: new Date().toISOString(),
    expectedDate: s(fd, "expected_date") || null,
  });
  revalidatePath("/purchase-orders");
  redirect("/purchase-orders");
}

// Receive an approved/sent PO: stock the linked item in at own location, log the
// movement, mark received, and notify the admin. Completes the PO -> stock loop.
export async function receivePO(fd: FormData) {
  const u = await guard("po.receive");
  const id = Number(s(fd, "id"));
  const po = (await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)))[0];
  if (!po || po.status === "received") redirect("/purchase-orders");

  const now = new Date().toISOString();
  const qty = po.qty ?? 0;
  if (po.itemId != null && qty > 0) {
    const rows = await db.select().from(stock).where(and(eq(stock.itemId, po.itemId), eq(stock.locationId, OWN_LOC)));
    const current = rows[0];
    if (current) await db.update(stock).set({ onHand: current.onHand + qty }).where(eq(stock.id, current.id));
    else await db.insert(stock).values({ itemId: po.itemId, locationId: OWN_LOC, onHand: qty, reserved: 0 });
    await db.insert(movements).values({ itemId: po.itemId, locationId: OWN_LOC, type: "stock_in", quantity: qty, note: `PO ${po.code} received`, createdAt: now });
  }
  await db.update(purchaseOrders).set({ status: "received" }).where(eq(purchaseOrders.id, id));

  await db.insert(notifications).values({
    message: `${u.name} received ${po.code} — ${qty} × ${po.itemSummary}. Warehouse stock updated.`,
    kind: "po_received",
    read: 0,
    createdAt: now,
  });

  revalidatePath("/purchase-orders");
  revalidatePath("/items");
  revalidatePath("/", "layout");
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

export async function requestTransfer(fd: FormData) {
  const u = await guard("transfer.request");
  const itemId = n(fd, "item_id");
  const qty = Math.max(0, Number(s(fd, "quantity")) || 0);
  const to = n(fd, "to_location_id");
  if (!itemId || !qty || !to) redirect("/transfers/new");

  const it = (await db.select().from(items).where(eq(items.id, itemId)))[0];
  const count = (await db.select().from(transferOrders)).length;
  const code = `TR-${2002 + count}`;
  const now = new Date().toISOString();

  await db.insert(transferOrders).values({
    code,
    itemId,
    itemName: it?.name ?? "Item",
    quantity: qty,
    fromLocationId: OWN_LOC,
    toLocationId: to,
    status: "requested",
    requestedBy: u.name.split(" ")[0],
    requestedAt: now,
    dispatchedAt: null,
    expectedDate: null,
    receivedAt: null,
  });

  revalidatePath("/transfers");
  redirect("/transfers?tab=requests");
}

export async function rejectTransferRequest(fd: FormData) {
  await guard("transfer.approve");
  const id = Number(s(fd, "id"));
  const now = new Date().toISOString();
  await db.update(transferOrders).set({ status: "rejected", rejectedAt: now }).where(eq(transferOrders.id, id));
  revalidatePath("/transfers");
  redirect("/transfers?tab=requests");
}

export async function createTransfer(fd: FormData) {
  const requestId = n(fd, "request_id");
  const u = await guard(requestId ? "transfer.approve" : "transfer.create");
  const itemId = n(fd, "item_id");
  const qty = Math.max(0, Number(s(fd, "quantity")) || 0);
  const from = n(fd, "from_location_id") ?? OWN_LOC;
  const to = n(fd, "to_location_id");
  if (!itemId || !qty || !to) redirect("/transfers/new");

  const now = new Date().toISOString();

  // vehicle is picked from a dropdown; its assigned driver comes along automatically
  const vehicleId = n(fd, "vehicle_id");
  const veh = vehicleId ? (await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)))[0] : null;
  const drv = veh?.assignedDriverId ? (await db.select().from(drivers).where(eq(drivers.id, veh.assignedDriverId)))[0] : null;

  // deduct from the source hub (goes in transit) — never dispatch more than what's actually there,
  // or the destination would receive stock that never left the source (phantom stock).
  const src = (await db.select().from(stock).where(and(eq(stock.itemId, itemId), eq(stock.locationId, from))))[0];
  const dispatchQty = Math.min(qty, src?.onHand ?? 0);
  if (dispatchQty <= 0) redirect(requestId ? "/transfers?tab=requests" : "/transfers/new");
  if (src) await db.update(stock).set({ onHand: src.onHand - dispatchQty }).where(eq(stock.id, src.id));

  if (requestId) {
    // accepting a staff request — update the same row instead of creating a new one
    const t = (await db.select().from(transferOrders).where(eq(transferOrders.id, requestId)))[0];
    if (!t || t.status !== "requested") redirect("/transfers?tab=requests");
    await db.insert(movements).values({ itemId, locationId: from, type: "transfer", quantity: dispatchQty, note: `Transfer ${t.code} dispatched`, createdAt: now });
    await db.update(transferOrders).set({
      fromLocationId: from,
      quantity: dispatchQty,
      status: "in_transit",
      vehicleId: veh?.id ?? null,
      vehicle: veh?.label ?? null,
      driverName: drv?.name ?? null,
      driverPhone: drv?.phone ?? null,
      dispatchedAt: now,
      expectedDate: s(fd, "expected_date") || null,
      createdBy: u.name.split(" ")[0],
    }).where(eq(transferOrders.id, requestId));
  } else {
    const it = (await db.select().from(items).where(eq(items.id, itemId)))[0];
    const count = (await db.select().from(transferOrders)).length;
    const code = `TR-${2002 + count}`;
    await db.insert(movements).values({ itemId, locationId: from, type: "transfer", quantity: dispatchQty, note: `Transfer ${code} dispatched`, createdAt: now });
    await db.insert(transferOrders).values({
      code,
      itemId,
      itemName: it?.name ?? "Item",
      quantity: dispatchQty,
      fromLocationId: from,
      toLocationId: to,
      status: "in_transit",
      vehicleId: veh?.id ?? null,
      vehicle: veh?.label ?? null,
      driverName: drv?.name ?? null,
      driverPhone: drv?.phone ?? null,
      dispatchedAt: now,
      expectedDate: s(fd, "expected_date") || null,
      receivedAt: null,
      createdBy: u.name.split(" ")[0],
    });
  }

  revalidatePath("/transfers");
  revalidatePath("/items");
  redirect("/transfers");
}

export async function receiveTransfer(fd: FormData) {
  const u = await guard("transfer.receive");
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

  // Notify the admin that staff confirmed receipt (all items scanned in).
  await db.insert(notifications).values({
    message: `${u.name} received transfer ${t.code} — ${t.quantity} × ${t.itemName}. Warehouse stock updated.`,
    kind: "transfer_received",
    read: 0,
    createdAt: now,
  });

  revalidatePath("/transfers");
  revalidatePath("/items");
  revalidatePath("/", "layout"); // refresh the top-bar bell count
  redirect("/transfers");
}

// Core sale writer: one header + many lines. Deducts stock per line, logs movements.
// Returns the new sale id. Callers handle the redirect to the receipt.
async function recordSale(userName: string, customer: string, lines: { itemId: number; qty: number }[]): Promise<number | null> {
  const cust = customer.trim();
  const clean = lines.map((l) => ({ itemId: Number(l.itemId), qty: Math.max(0, Number(l.qty) || 0) })).filter((l) => l.itemId && l.qty > 0);
  if (!cust || clean.length === 0) return null;

  const now = new Date().toISOString();
  const [sale] = await db
    .insert(sales)
    .values({ code: "TEMP", customerName: cust, total: 0, createdBy: userName, createdAt: now })
    .returning({ id: sales.id });

  let total = 0;
  for (const l of clean) {
    const it = (await db.select().from(items).where(eq(items.id, l.itemId)))[0];
    if (!it) continue;
    const rows = await db.select().from(stock).where(and(eq(stock.itemId, l.itemId), eq(stock.locationId, OWN_LOC)));
    const current = rows[0];
    const onHand = current?.onHand ?? 0;
    const sold = Math.min(l.qty, onHand); // never go negative
    if (sold <= 0) continue;

    if (current) await db.update(stock).set({ onHand: onHand - sold }).where(eq(stock.id, current.id));
    await db.insert(movements).values({ itemId: l.itemId, locationId: OWN_LOC, type: "stock_out", quantity: sold, note: `Sold to ${cust}`, createdAt: now });

    const unitPrice = it.price ?? 0;
    const lineTotal = unitPrice * sold;
    total += lineTotal;
    await db.insert(saleItems).values({ saleId: sale.id, itemId: l.itemId, itemName: it.name, quantity: sold, unitPrice, lineTotal });
  }

  await db.update(sales).set({ code: `SALE-${String(sale.id).padStart(4, "0")}`, total }).where(eq(sales.id, sale.id));
  revalidatePath("/items");
  return sale.id;
}

// Single-item sell from the item detail page (FormData form).
export async function sellItem(fd: FormData) {
  const u = await guard("stock.move");
  const itemId = Number(s(fd, "id"));
  const customer = s(fd, "customer");
  const qty = Math.max(0, Number(s(fd, "qty")) || 0);
  const saleId = await recordSale(u.name, customer, [{ itemId, qty }]);
  if (!saleId) redirect(`/items/${itemId}`);
  revalidatePath(`/items/${itemId}`);
  redirect(`/sales/${saleId}`);
}

// Multi-item checkout (POS register). lines come from the /checkout page.
export async function createSale(customer: string, lines: { itemId: number; qty: number }[]) {
  const u = await guard("stock.move");
  const saleId = await recordSale(u.name, customer, lines ?? []);
  if (!saleId) redirect("/checkout");
  redirect(`/sales/${saleId}`);
}

export async function addStaff(fd: FormData) {
  await guard("team.manage");
  const name = s(fd, "name");
  const email = s(fd, "email").toLowerCase();
  const password = s(fd, "password");
  const role = s(fd, "role") === "admin" ? "admin" : "staff";
  if (!name || !email || password.length < 6) redirect("/employees");

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing[0]) redirect("/employees");

  await db.insert(users).values({ name, email, password, role, createdAt: new Date().toISOString() });
  revalidatePath("/employees");
  redirect("/employees");
}

export async function addDriver(fd: FormData) {
  await guard("team.manage");
  const name = s(fd, "name");
  if (!name) redirect("/employees");
  await db.insert(drivers).values({ name, phone: s(fd, "phone") || null });
  revalidatePath("/employees");
  redirect("/employees");
}

// ---- CSV bulk import (Phase 1) ----
export type ImportResult = { inserted: number; categoriesCreated: number };

export async function importItems(type: ImportType, rows: ParsedRow[]): Promise<ImportResult> {
  await guard("item.create");
  if (!rows || rows.length === 0) return { inserted: 0, categoriesCreated: 0 };

  // Preload existing categories of this type; create missing ones on the fly.
  const existing = await db.select().from(categories).where(eq(categories.type, type));
  const catByName = new Map(existing.map((c) => [c.name.trim().toLowerCase(), c.id]));
  let categoriesCreated = 0;

  async function resolveCategory(name: unknown): Promise<number | null> {
    const nm = String(name ?? "").trim();
    if (!nm) return null;
    const key = nm.toLowerCase();
    const hit = catByName.get(key);
    if (hit) return hit;
    const [row] = await db.insert(categories).values({ name: nm, type }).returning({ id: categories.id });
    catByName.set(key, row.id);
    categoriesCreated++;
    return row.id;
  }

  const now = new Date().toISOString();
  const firstStatus = Object.keys(getIndustry(type).statuses)[0] ?? null;
  let inserted = 0;

  for (const r of rows) {
    const name = String(r.name ?? "").trim();
    if (!name) continue;
    const categoryId = await resolveCategory(r.category);

    if (type === "physical") {
      const [row] = await db
        .insert(items)
        .values({
          type,
          name,
          sku: (r.sku as string) || null,
          barcode: (r.barcode as string) || null,
          categoryId,
          status: null, // physical status is derived from stock
          price: r.price == null ? null : Number(r.price),
          reorderPoint: r.reorder_point == null ? null : Number(r.reorder_point),
          primaryLocationId: OWN_LOC,
          attrs: JSON.stringify({ unit_of_measure: (r.unit_of_measure as string) || "unit", tracking_mode: "none" }),
          createdAt: now,
        })
        .returning({ id: items.id });
      const qty = r.quantity == null ? 0 : Math.max(0, Number(r.quantity));
      await db.insert(stock).values({ itemId: row.id, locationId: OWN_LOC, onHand: qty, reserved: 0 });
      if (qty > 0)
        await db.insert(movements).values({ itemId: row.id, locationId: OWN_LOC, type: "stock_in", quantity: qty, note: "Opening stock (CSV import)", createdAt: now });
    } else {
      // real_estate
      await db.insert(items).values({
        type,
        name,
        sku: null,
        barcode: null,
        categoryId,
        status: (r.status as string) || firstStatus,
        price: r.price == null ? null : Number(r.price),
        reorderPoint: null,
        primaryLocationId: 2,
        attrs: JSON.stringify({
          block: (r.block as string) || null,
          floor: r.floor ?? null,
          bedrooms: r.bedrooms ?? null,
          bathrooms: r.bathrooms ?? null,
          area_sqft: r.area_sqft ?? null,
          furnished: Boolean(r.furnished),
        }),
        createdAt: now,
      });
    }
    inserted++;
  }

  revalidatePath("/items");
  revalidatePath("/categories");
  revalidatePath("/dashboard");
  return { inserted, categoriesCreated };
}

// Any signed-in user can send feedback / report a problem from the guide page.
export async function submitFeedback(fd: FormData) {
  const u = await getUser();
  if (!u) redirect("/login");
  const message = s(fd, "message");
  if (!message) redirect("/guide");
  await db.insert(feedback).values({ userName: u.name, message, handled: 0, createdAt: new Date().toISOString() });
  revalidatePath("/guide");
  redirect("/guide?sent=1");
}

// Mark all notifications read (called when the admin opens the bell).
export async function markNotificationsRead() {
  await guard("team.manage");
  await db.update(notifications).set({ read: 1 }).where(eq(notifications.read, 0));
  revalidatePath("/", "layout");
}

// ---- Suppliers (admin manage: add / edit / delete) ----
// Plain-arg actions called from the SupplierAdmin client component.
export async function addSupplier(name: string, phone: string, leadTimeDays: number) {
  await guard("supplier.manage");
  const nm = String(name ?? "").trim();
  if (!nm) return;
  const lead = Math.max(0, Math.floor(Number(leadTimeDays) || 0));
  await db.insert(suppliers).values({ name: nm, phone: String(phone ?? "").trim() || null, leadTimeDays: lead });
  revalidatePath("/suppliers");
}

export async function updateSupplier(id: number, name: string, phone: string, leadTimeDays: number) {
  await guard("supplier.manage");
  const nm = String(name ?? "").trim();
  if (!nm) return;
  const lead = Math.max(0, Math.floor(Number(leadTimeDays) || 0));
  await db.update(suppliers).set({ name: nm, phone: String(phone ?? "").trim() || null, leadTimeDays: lead }).where(eq(suppliers.id, Number(id)));
  revalidatePath("/suppliers");
}

export async function deleteSupplier(id: number) {
  await guard("supplier.manage");
  await db.delete(suppliers).where(eq(suppliers.id, Number(id)));
  revalidatePath("/suppliers");
}

// ---- Categories (add / update / delete) ----
export async function addCategory(name: string, type: string) {
  await guard("item.create");
  const nm = String(name ?? "").trim();
  if (!nm || !type) return;
  await db.insert(categories).values({ name: nm, type });
  revalidatePath("/categories");
}

export async function updateCategory(id: number, name: string) {
  await guard("item.create");
  const nm = String(name ?? "").trim();
  if (!nm) return;
  await db.update(categories).set({ name: nm }).where(eq(categories.id, Number(id)));
  revalidatePath("/categories");
}

export async function deleteCategory(id: number) {
  await guard("item.create");
  // Detach items from the category first so they aren't orphaned to a dead id.
  await db.update(items).set({ categoryId: null }).where(eq(items.categoryId, Number(id)));
  await db.delete(categories).where(eq(categories.id, Number(id)));
  revalidatePath("/categories");
  revalidatePath("/items");
}

// ---- Staff & drivers (update / delete) ----
export async function updateStaff(id: number, name: string, role: string) {
  await guard("team.manage");
  const nm = String(name ?? "").trim();
  if (!nm) return;
  const r = role === "admin" ? "admin" : "staff";
  await db.update(users).set({ name: nm, role: r }).where(eq(users.id, Number(id)));
  revalidatePath("/employees");
}

export async function deleteStaff(id: number) {
  const me = await guard("team.manage");
  if (me.id === Number(id)) return; // never delete yourself
  await db.delete(users).where(eq(users.id, Number(id)));
  revalidatePath("/employees");
}

export async function updateDriver(id: number, name: string, phone: string) {
  await guard("team.manage");
  const nm = String(name ?? "").trim();
  if (!nm) return;
  await db.update(drivers).set({ name: nm, phone: String(phone ?? "").trim() || null }).where(eq(drivers.id, Number(id)));
  revalidatePath("/employees");
}

export async function deleteDriver(id: number) {
  await guard("team.manage");
  await db.delete(drivers).where(eq(drivers.id, Number(id)));
  revalidatePath("/employees");
}

export async function addVehicle(fd: FormData) {
  await guard("team.manage");
  const label = s(fd, "label");
  if (!label) redirect("/transport");
  await db.insert(vehicles).values({ label, assignedDriverId: n(fd, "driver_id") });
  revalidatePath("/transport");
  redirect("/transport");
}

export async function assignVehicleDriver(fd: FormData) {
  await guard("team.manage");
  const id = Number(s(fd, "id"));
  await db.update(vehicles).set({ assignedDriverId: n(fd, "driver_id") }).where(eq(vehicles.id, id));
  revalidatePath("/transport");
  redirect("/transport");
}
