import { db } from "@/db/client";
import { eq, desc } from "drizzle-orm";
import { items, categories, stock, locations, purchaseOrders, movements, suppliers, transferOrders, users, drivers, vehicles, notifications, sales, saleItems, feedback } from "@/db/schema";
import { getIndustry, type IndustryKey, type Industry } from "./industries";
import { num, money, moneyCompact, date, daysBetween, daysUntil } from "./format";

export const COMPANY_NAME = "Anwar Supplies & Properties";
const OWN_LOCATION_ID = 1; // "own location" default (Main Warehouse)

export type RowData = {
  id: number;
  name: string;
  sku: string | null;
  categoryName: string | null;
  statusKey: string;
  price: number | null;
  reorderPoint: number | null;
  available: number | null;
  onHand: number | null;
  reserved: number | null;
  attrs: Record<string, any>;
};

type Raw = {
  items: (typeof items.$inferSelect)[];
  categories: (typeof categories.$inferSelect)[];
  stock: (typeof stock.$inferSelect)[];
  locations: (typeof locations.$inferSelect)[];
  pos: (typeof purchaseOrders.$inferSelect)[];
  movements: (typeof movements.$inferSelect)[];
  suppliers: (typeof suppliers.$inferSelect)[];
  transfers: (typeof transferOrders.$inferSelect)[];
};

async function loadAll(): Promise<Raw> {
  const [i, c, s, l, p, m, su, tr] = await Promise.all([
    db.select().from(items),
    db.select().from(categories),
    db.select().from(stock),
    db.select().from(locations),
    db.select().from(purchaseOrders),
    db.select().from(movements),
    db.select().from(suppliers),
    db.select().from(transferOrders),
  ]);
  return { items: i, categories: c, stock: s, locations: l, pos: p, movements: m, suppliers: su, transfers: tr };
}

function parseAttrs(raw: string | null): Record<string, any> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function physicalStatus(available: number, reorder: number | null): string {
  if (available <= 0) return "out_of_stock";
  if (reorder != null && available < reorder) return "low_stock";
  return "in_stock";
}

function locationLabel(key: IndustryKey, raw: Raw): string {
  if (key === "real_estate") return raw.locations.find((l) => l.kind === "property")?.name ?? "Rio Tower";
  if (key === "digital") return "All licenses";
  if (key === "kit") return "Catalogue";
  return raw.locations.find((l) => l.id === OWN_LOCATION_ID)?.name ?? "Main Warehouse";
}

const isLocationScoped = (key: IndustryKey) => key === "physical" || key === "equipment";

function buildRows(raw: Raw, key: IndustryKey, locationId = OWN_LOCATION_ID): RowData[] {
  const catName = new Map(raw.categories.map((c) => [c.id, c.name]));
  const stockAt = (itemId: number) =>
    raw.stock.filter((s) => s.itemId === itemId && s.locationId === locationId);

  return raw.items
    .filter((it) => it.type === key)
    .map((it) => {
      const attrs = parseAttrs(it.attrs);
      let onHand: number | null = null;
      let reserved: number | null = null;
      let available: number | null = null;
      let statusKey = it.status ?? "";

      if (key === "physical" || key === "equipment") {
        const rows = stockAt(it.id);
        onHand = rows.reduce((a, s) => a + s.onHand, 0);
        reserved = rows.reduce((a, s) => a + s.reserved, 0);
        available = onHand - reserved;
        if (key === "physical") statusKey = physicalStatus(available, it.reorderPoint);
      }

      return {
        id: it.id,
        name: it.name,
        sku: it.sku,
        categoryName: it.categoryId ? catName.get(it.categoryId) ?? null : null,
        statusKey,
        price: it.price,
        reorderPoint: it.reorderPoint,
        available,
        onHand,
        reserved,
        attrs,
      };
    });
}

// ---- Items list ----
export async function getItemsPage(key: IndustryKey) {
  const raw = await loadAll();
  const rows = buildRows(raw, key);
  const cats = raw.categories
    .filter((c) => c.type === key)
    .map((c) => c.name);
  return { rows, categories: cats, location: locationLabel(key, raw), locationScoped: isLocationScoped(key) };
}

// ---- Dashboard ----
export type Kpi = { label: string; value: string; sub?: string; delta?: string; deltaTone?: "ok" | "warn" | "danger" | "neutral"; spark: number[] };
export type UrgentItem = { title: string; meta: string; action: string; tone: "warn" | "danger" | "info"; href?: string };
export type ChartData = { title: string; unit: string; labels: string[]; series: number[] };
export type Dashboard = {
  industry: Industry;
  company: string;
  location: string;
  kpis: Kpi[];
  urgent: UrgentItem[];
  chart: ChartData;
  recent: { text: string; when: string }[];
};

const SPARKS: number[][] = [
  [4, 6, 5, 7, 6, 8, 7, 9],
  [9, 8, 8, 7, 6, 6, 5, 4],
  [3, 4, 4, 5, 6, 6, 7, 8],
  [6, 5, 6, 7, 6, 7, 8, 9],
];
const spark = (i: number) => SPARKS[i % SPARKS.length];

const MONTHS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];

function chartFor(key: IndustryKey): ChartData {
  const preset: Record<IndustryKey, { title: string; unit: string; series: number[] }> = {
    physical: { title: "Stock movements", unit: "units", series: [320, 410, 380, 520, 470, 610, 540, 700, 660, 720, 690, 810] },
    real_estate: { title: "Units sold", unit: "units", series: [1, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7] },
    equipment: { title: "Asset utilisation", unit: "%", series: [60, 62, 58, 70, 66, 72, 68, 75, 71, 78, 74, 80] },
    digital: { title: "Seats assigned", unit: "seats", series: [8, 10, 12, 14, 15, 18, 20, 22, 21, 24, 23, 26] },
    kit: { title: "Kits assembled", unit: "kits", series: [2, 3, 3, 4, 5, 4, 6, 7, 6, 8, 7, 9] },
  };
  return { ...preset[key], labels: MONTHS };
}

export async function getDashboard(key: IndustryKey): Promise<Dashboard> {
  const raw = await loadAll();
  const industry = getIndustry(key);
  const rows = buildRows(raw, key);
  const locName = locationLabel(key, raw);
  const countBy = (status: string) => rows.filter((r) => r.statusKey === status).length;

  let kpis: Kpi[] = [];
  let urgent: UrgentItem[] = [];
  let recent: { text: string; when: string }[] = [];

  if (key === "physical") {
    const stockValue = rows.reduce((a, r) => a + (r.onHand ?? 0) * (r.price ?? 0), 0);
    kpis = [
      { label: "Total SKUs", value: num(rows.length), delta: "+3 this month", deltaTone: "neutral", spark: spark(0) },
      { label: "Low stock", value: num(countBy("low_stock")), sub: "need reorder", deltaTone: "warn", spark: spark(1) },
      { label: "Out of stock", value: num(countBy("out_of_stock")), sub: "act now", deltaTone: "danger", spark: spark(1) },
      { label: "Stock value", value: moneyCompact(stockValue), delta: "+12% vs last month", deltaTone: "ok", spark: spark(3) },
    ];
    urgent = rows
      .filter((r) => r.statusKey === "low_stock" || r.statusKey === "out_of_stock")
      .slice(0, 3)
      .map((r) => ({
        title: r.name,
        meta: r.statusKey === "out_of_stock" ? `Out of stock · available 0` : `Low · ${r.available} available, reorder at ${r.reorderPoint}`,
        action: "Create PO",
        tone: r.statusKey === "out_of_stock" ? "danger" : "warn",
        href: "/purchase-orders/new",
      }));
    const pendingPO = raw.pos.find((p) => p.status === "pending_approval");
    if (pendingPO)
      urgent.unshift({
        title: `${pendingPO.code} waiting for your approval`,
        meta: `${pendingPO.qty} × ${pendingPO.itemSummary} · raised by ${pendingPO.createdBy}`,
        action: "Approve",
        tone: "info",
        href: "/purchase-orders",
      });
    const subLow = await getLowStockAlerts();
    for (const a of subLow.slice(0, 2)) {
      urgent.push({
        title: `${a.itemName} low at ${a.locationName}`,
        meta: `${a.available} available, reorder at ${a.reorderPoint}`,
        action: "Send transfer",
        tone: "warn",
        href: `/transfers/new?item_id=${a.itemId}&to_location_id=${a.locationId}`,
      });
    }
    const pendingRequests = raw.transfers.filter((t) => t.status === "requested").length;
    if (pendingRequests > 0)
      urgent.unshift({
        title: `${pendingRequests} transfer request${pendingRequests > 1 ? "s" : ""} waiting`,
        meta: "Staff asked for stock to be moved",
        action: "Review",
        tone: "info",
        href: "/transfers?tab=requests",
      });
    recent = [
      { text: "150 × A4 Premium Paper sold at counter", when: "2 days ago" },
      { text: "PO-1039 received — 500 × A4 Standard", when: "12 days ago" },
      { text: "8 × Black Ink Cartridge issued to Printing", when: "4 days ago" },
    ];
  } else if (key === "real_estate") {
    const sold = countBy("sold");
    kpis = [
      { label: "Total units", value: num(rows.length), sub: "Rio Tower", deltaTone: "neutral", spark: spark(0) },
      { label: "Available", value: num(countBy("available")), deltaTone: "ok", spark: spark(2) },
      { label: "Reserved", value: num(countBy("reserved")), sub: "awaiting payment", deltaTone: "warn", spark: spark(0) },
      { label: "Sold", value: `${sold} of ${rows.length}`, delta: `${Math.round((sold / rows.length) * 100)}% sold`, deltaTone: "ok", spark: spark(2) },
    ];
    urgent = [
      { title: `${countBy("reserved")} units reserved — awaiting payment`, meta: "Floor 7 · confirm deposits before release", action: "Review", tone: "warn" },
      { title: `${countBy("available")} units still available`, meta: "Floor 8 · list for the next sales push", action: "View", tone: "info" },
    ];
    recent = [
      { text: "Unit 703 moved to Reserved", when: "1 day ago" },
      { text: "Unit 601 marked Sold", when: "6 days ago" },
      { text: "Unit 803 taken Off market", when: "9 days ago" },
    ];
  } else if (key === "equipment") {
    kpis = [
      { label: "Total assets", value: num(rows.length), deltaTone: "neutral", spark: spark(0) },
      { label: "In use", value: num(countBy("in_use")), deltaTone: "ok", spark: spark(2) },
      { label: "Available", value: num(countBy("available")), deltaTone: "ok", spark: spark(3) },
      { label: "Maintenance", value: num(countBy("under_maintenance")), sub: "needs attention", deltaTone: "warn", spark: spark(1) },
    ];
    urgent = rows
      .filter((r) => r.statusKey === "under_maintenance")
      .map((r) => ({ title: r.name, meta: `${r.attrs.condition ?? "—"} · unassigned`, action: "Schedule service", tone: "warn" as const }));
    recent = [
      { text: "Forklift FL-01 assigned to Rahim", when: "2 days ago" },
      { text: "Handheld Scanner SC-7 sent for repair", when: "3 days ago" },
    ];
  } else if (key === "digital") {
    const seats = rows.reduce((a, r) => a + (r.attrs.seats ?? 0), 0);
    const used = rows.reduce((a, r) => a + (r.attrs.seats_used ?? 0), 0);
    const expiring = rows.filter((r) => r.attrs.expiry_date && daysUntil(r.attrs.expiry_date) > 0 && daysUntil(r.attrs.expiry_date) <= 60);
    kpis = [
      { label: "Total licenses", value: num(rows.length), deltaTone: "neutral", spark: spark(0) },
      { label: "Seats used", value: `${used} / ${seats}`, deltaTone: "ok", spark: spark(2) },
      { label: "Expiring soon", value: num(expiring.length), sub: "within 60 days", deltaTone: "warn", spark: spark(1) },
      { label: "Active", value: num(countBy("active")), deltaTone: "ok", spark: spark(3) },
    ];
    urgent = rows
      .filter((r) => r.statusKey === "expired" || (r.attrs.expiry_date && daysUntil(r.attrs.expiry_date) > 0 && daysUntil(r.attrs.expiry_date) <= 60))
      .slice(0, 3)
      .map((r) => ({
        title: r.name,
        meta: r.statusKey === "expired" ? `Expired ${date(r.attrs.expiry_date)}` : `Expires ${date(r.attrs.expiry_date)}`,
        action: "Renew",
        tone: r.statusKey === "expired" ? "danger" : "warn",
      }));
    recent = [
      { text: "Design Suite — 3 of 3 seats assigned", when: "5 days ago" },
      { text: "Old CRM License expired", when: "—" },
    ];
  } else {
    // kit
    const value = rows.reduce((a, r) => a + (r.price ?? 0), 0);
    kpis = [
      { label: "Total kits", value: num(rows.length), deltaTone: "neutral", spark: spark(0) },
      { label: "Active", value: num(countBy("active")), deltaTone: "ok", spark: spark(2) },
      { label: "Buildable now", value: num(1), sub: "from current stock", deltaTone: "warn", spark: spark(1) },
      { label: "Catalogue value", value: moneyCompact(value), deltaTone: "ok", spark: spark(3) },
    ];
    urgent = [
      { title: "Furnished Flat Bundle — component low", meta: "Sofa Set out of stock", action: "Resolve", tone: "warn" },
    ];
    recent = [{ text: "Office Starter Pack assembled ×4", when: "3 days ago" }];
  }

  return {
    industry,
    company: COMPANY_NAME,
    location: locName,
    kpis,
    urgent,
    chart: chartFor(key),
    recent,
  };
}

export async function getAlertCount(key: IndustryKey): Promise<number> {
  const d = await getDashboard(key);
  return d.urgent.length;
}

// ---- Item detail ----
export type ItemDetail = {
  id: number;
  type: IndustryKey;
  name: string;
  sku: string | null;
  barcode: string | null;
  categoryName: string | null;
  categoryId: number | null;
  statusKey: string;
  price: number | null;
  reorderPoint: number | null;
  attrs: Record<string, any>;
  stockByLocation: { location: string; onHand: number; reserved: number; available: number }[];
  totals: { onHand: number; reserved: number; available: number };
};

export async function getItem(id: number): Promise<ItemDetail | null> {
  const raw = await loadAll();
  const it = raw.items.find((i) => i.id === id);
  if (!it) return null;
  const catName = it.categoryId ? raw.categories.find((c) => c.id === it.categoryId)?.name ?? null : null;
  const locName = new Map(raw.locations.map((l) => [l.id, l.name]));
  const st = raw.stock.filter((s) => s.itemId === id);
  const stockByLocation = st.map((s) => ({
    location: locName.get(s.locationId) ?? "—",
    onHand: s.onHand,
    reserved: s.reserved,
    available: s.onHand - s.reserved,
  }));
  const totals = stockByLocation.reduce(
    (a, s) => ({ onHand: a.onHand + s.onHand, reserved: a.reserved + s.reserved, available: a.available + s.available }),
    { onHand: 0, reserved: 0, available: 0 }
  );
  let statusKey = it.status ?? "";
  if (it.type === "physical") statusKey = physicalStatus(totals.available, it.reorderPoint);
  return {
    id: it.id,
    type: it.type as IndustryKey,
    name: it.name,
    sku: it.sku,
    barcode: it.barcode,
    categoryName: catName,
    categoryId: it.categoryId,
    statusKey,
    price: it.price,
    reorderPoint: it.reorderPoint,
    attrs: parseAttrs(it.attrs),
    stockByLocation,
    totals,
  };
}

export async function getItemMovements(id: number) {
  const raw = await loadAll();
  const locName = new Map(raw.locations.map((l) => [l.id, l.name]));
  return raw.movements
    .filter((m) => m.itemId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((m) => ({ id: m.id, type: m.type, quantity: m.quantity, note: m.note, createdAt: m.createdAt, location: locName.get(m.locationId) ?? "—" }));
}

export async function getCategoriesForType(key: IndustryKey) {
  const raw = await loadAll();
  return raw.categories.filter((c) => c.type === key).map((c) => ({ id: c.id, name: c.name }));
}

// ---- Purchase orders ----
export async function getPurchaseOrders() {
  const raw = await loadAll();
  const sup = new Map(raw.suppliers.map((s) => [s.id, s.name]));
  return raw.pos
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => ({
      id: p.id,
      code: p.code,
      supplier: p.supplierId ? sup.get(p.supplierId) ?? "—" : "—",
      status: p.status,
      total: p.total,
      itemId: p.itemId,
      itemSummary: p.itemSummary,
      qty: p.qty,
      createdBy: p.createdBy,
      createdAt: p.createdAt,
      expectedDate: p.expectedDate,
    }));
}

export const PO_STATUS: Record<string, { label: string; tone: "ok" | "warn" | "danger" | "info" | "neutral" }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_approval: { label: "Pending approval", tone: "warn" },
  approved: { label: "Approved", tone: "info" },
  sent: { label: "Sent to supplier", tone: "ok" },
  received: { label: "Received", tone: "ok" },
};

// ---- Suppliers ----
export async function getSuppliers() {
  const raw = await loadAll();
  return raw.suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    leadTimeDays: s.leadTimeDays,
    openPOs: raw.pos.filter((p) => p.supplierId === s.id && p.status !== "received").length,
  }));
}

// ---- Team (staff + drivers), Transport (vehicles) ----
export async function getTeamStaff() {
  const rows = await db.select().from(users);
  return rows
    .filter((u) => u.role === "admin" || u.role === "staff")
    .map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
}

export async function getDrivers() {
  const rows = await db.select().from(drivers);
  const veh = await db.select().from(vehicles);
  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    vehicleLabel: veh.find((v) => v.assignedDriverId === d.id)?.label ?? null,
  }));
}

export async function getVehicles() {
  const veh = await db.select().from(vehicles);
  const drv = new Map((await db.select().from(drivers)).map((d) => [d.id, d]));
  return veh.map((v) => {
    const d = v.assignedDriverId != null ? drv.get(v.assignedDriverId) : null;
    return { id: v.id, label: v.label, driverId: v.assignedDriverId, driverName: d?.name ?? null, driverPhone: d?.phone ?? null };
  });
}

// ---- Locations ----
export async function getLocationsOverview() {
  const raw = await loadAll();
  return raw.locations.map((l) => {
    const st = raw.stock.filter((s) => s.locationId === l.id);
    const skuCount = new Set(st.map((s) => s.itemId)).size;
    const unitCount = l.kind === "property" ? raw.items.filter((i) => i.type === "real_estate").length : skuCount;
    const onHand = st.reduce((a, s) => a + s.onHand, 0);
    const isHub = l.parentId == null && l.kind === "warehouse";
    return { id: l.id, name: l.name, kind: l.kind, city: l.city, isHub, parentId: l.parentId, itemCount: unitCount, onHand };
  });
}

// ---- Transfers (hub -> sub-warehouse, own transport) ----
export const TRANSFER_STATUS: Record<string, { label: string; tone: "ok" | "warn" | "neutral" }> = {
  requested: { label: "Requested", tone: "neutral" },
  in_transit: { label: "In transit", tone: "warn" },
  received: { label: "Received", tone: "ok" },
  rejected: { label: "Rejected", tone: "neutral" },
};

export async function getTransfers() {
  const raw = await loadAll();
  const loc = new Map(raw.locations.map((l) => [l.id, l.name]));
  return raw.transfers
    .slice()
    .sort((a, b) => (b.requestedAt ?? b.dispatchedAt ?? "").localeCompare(a.requestedAt ?? a.dispatchedAt ?? ""))
    .map((t) => ({
      id: t.id,
      code: t.code,
      itemName: t.itemName,
      quantity: t.quantity,
      from: loc.get(t.fromLocationId) ?? "—",
      to: loc.get(t.toLocationId) ?? "—",
      status: t.status,
      vehicle: t.vehicle,
      driverName: t.driverName,
      driverPhone: t.driverPhone,
      requestedBy: t.requestedBy,
      requestedAt: t.requestedAt,
      rejectedAt: t.rejectedAt,
      dispatchedAt: t.dispatchedAt,
      expectedDate: t.expectedDate,
      receivedAt: t.receivedAt,
      createdBy: t.createdBy,
    }));
}

// A staff request, loaded for the Accept -> prefilled New Transfer form.
export async function getTransferRequest(id: number) {
  const raw = await loadAll();
  const t = raw.transfers.find((r) => r.id === id && r.status === "requested");
  if (!t) return null;
  const loc = new Map(raw.locations.map((l) => [l.id, l.name]));
  return {
    id: t.id,
    itemId: t.itemId,
    itemName: t.itemName,
    quantity: t.quantity,
    toLocationId: t.toLocationId,
    toLocationName: loc.get(t.toLocationId) ?? "—",
    requestedBy: t.requestedBy,
    requestedAt: t.requestedAt,
  };
}

// Low stock per sub-warehouse (not just the hub total) — feeds the dashboard alert
// and the "Send transfer" prefill link.
export async function getLowStockAlerts() {
  const raw = await loadAll();
  const loc = new Map(raw.locations.map((l) => [l.id, l]));
  const subs = raw.locations.filter((l) => l.parentId != null);
  const alerts: { itemId: number; itemName: string; locationId: number; locationName: string; available: number; reorderPoint: number }[] = [];

  for (const it of raw.items) {
    if (it.type !== "physical" || it.reorderPoint == null) continue;
    for (const sub of subs) {
      const row = raw.stock.find((s) => s.itemId === it.id && s.locationId === sub.id);
      const available = (row?.onHand ?? 0) - (row?.reserved ?? 0);
      if (available < it.reorderPoint) {
        alerts.push({ itemId: it.id, itemName: it.name, locationId: sub.id, locationName: loc.get(sub.id)?.name ?? "—", available, reorderPoint: it.reorderPoint });
      }
    }
  }
  return alerts;
}

export async function getTransferFormData() {
  const raw = await loadAll();
  const physical = raw.items.filter((i) => i.type === "physical").map((i) => ({ id: i.id, name: i.name }));
  const hub = raw.locations.filter((l) => l.parentId == null && l.kind === "warehouse").map((l) => ({ id: l.id, name: l.name }));
  const subs = raw.locations
    .filter((l) => l.parentId != null)
    .map((l) => ({ id: l.id, name: l.name, city: l.city }));
  const vehicleList = await getVehicles();
  return { items: physical, hub, subs, vehicles: vehicleList };
}

// ---- Categories ----
export async function getCategoriesOverview() {
  const raw = await loadAll();
  return raw.categories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    itemCount: raw.items.filter((i) => i.categoryId === c.id).length,
  }));
}

// ---- Category detail (scan target) ----
export type CategoryItemRow = {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  onHand: number | null;
  statusKey: string;
};
export type CategoryDetail = {
  id: number;
  name: string;
  type: IndustryKey;
  scannable: boolean; // physical/equipment carry stock + barcodes
  items: CategoryItemRow[];
};

export async function getCategoryDetail(id: number): Promise<CategoryDetail | null> {
  const raw = await loadAll();
  const c = raw.categories.find((x) => x.id === id);
  if (!c) return null;
  const type = c.type as IndustryKey;
  const scannable = type === "physical" || type === "equipment";
  const items = raw.items
    .filter((it) => it.categoryId === id)
    .map((it) => {
      const rows = raw.stock.filter((s) => s.itemId === it.id && s.locationId === OWN_LOCATION_ID);
      const onHand = scannable ? rows.reduce((a, s) => a + s.onHand, 0) : null;
      let statusKey = it.status ?? "";
      if (type === "physical") statusKey = physicalStatus((onHand ?? 0) - rows.reduce((a, s) => a + s.reserved, 0), it.reorderPoint);
      return { id: it.id, name: it.name, sku: it.sku, barcode: it.barcode, onHand, statusKey };
    });
  return { id: c.id, name: c.name, type, scannable, items };
}

// Barcode lookup for scan stock-in. Optionally restrict to a category.
export async function findItemByBarcode(barcode: string, categoryId?: number) {
  const raw = await loadAll();
  const code = barcode.trim();
  const it = raw.items.find(
    (x) => x.barcode === code && (categoryId == null || x.categoryId === categoryId)
  );
  if (!it) return null;
  const onHand = raw.stock
    .filter((s) => s.itemId === it.id && s.locationId === OWN_LOCATION_ID)
    .reduce((a, s) => a + s.onHand, 0);
  return { id: it.id, name: it.name, barcode: it.barcode, categoryId: it.categoryId, onHand };
}

// ---- Reports ----
export type Reports = {
  industry: Industry;
  statusBreakdown: { key: string; label: string; count: number; tone: string }[];
  totalItems: number;
  lowStock: { id: number; name: string; available: number; reorderPoint: number | null }[];
  outOfStock: { id: number; name: string }[];
  stockValue: number;
};

export async function getReports(key: IndustryKey): Promise<Reports> {
  const raw = await loadAll();
  const industry = getIndustry(key);
  const rows = buildRows(raw, key);
  const statusBreakdown = Object.entries(industry.statuses).map(([k, def]) => ({
    key: k,
    label: def.label,
    tone: def.tone,
    count: rows.filter((r) => r.statusKey === k).length,
  }));
  const lowStock = rows
    .filter((r) => r.statusKey === "low_stock")
    .map((r) => ({ id: r.id, name: r.name, available: r.available ?? 0, reorderPoint: r.reorderPoint }));
  const outOfStock = rows.filter((r) => r.statusKey === "out_of_stock").map((r) => ({ id: r.id, name: r.name }));
  const stockValue = rows.reduce((a, r) => a + (r.onHand ?? 0) * (r.price ?? 0) + (r.available == null ? (r.price ?? 0) : 0), 0);
  return { industry, statusBreakdown, totalItems: rows.length, lowStock, outOfStock, stockValue };
}

// ---- Notifications (top-bar bell) ----
export async function getNotifications() {
  const rows = await db.select().from(notifications).orderBy(desc(notifications.id)).limit(20);
  return {
    items: rows.map((n) => ({ id: n.id, message: n.message, kind: n.kind, read: n.read === 1, createdAt: n.createdAt })),
    unread: rows.filter((n) => n.read === 0).length,
  };
}

// ---- Sale / receipt (header + lines) ----
export async function getSale(id: number) {
  const row = (await db.select().from(sales).where(eq(sales.id, id)))[0];
  if (!row) return null;
  const lines = await db.select().from(saleItems).where(eq(saleItems.saleId, id));
  return {
    id: row.id,
    code: row.code,
    customerName: row.customerName,
    total: row.total ?? 0,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    company: COMPANY_NAME,
    lines: lines.map((l) => ({
      itemName: l.itemName,
      quantity: l.quantity,
      unitPrice: l.unitPrice ?? 0,
      lineTotal: l.lineTotal ?? 0,
    })),
  };
}

// Catalog of sellable items (stock on hand) for the checkout register.
export async function getSellableItems(key: IndustryKey) {
  const raw = await loadAll();
  return raw.items
    .filter((it) => it.type === key)
    .map((it) => {
      const onHand = raw.stock
        .filter((s) => s.itemId === it.id && s.locationId === OWN_LOCATION_ID)
        .reduce((a, s) => a + s.onHand, 0);
      return { id: it.id, name: it.name, barcode: it.barcode, price: it.price ?? 0, onHand };
    })
    .filter((r) => r.onHand > 0);
}

// ---- Feedback (admin views what users reported) ----
export async function getFeedback() {
  const rows = await db.select().from(feedback).orderBy(desc(feedback.id)).limit(50);
  return rows.map((f) => ({ id: f.id, userName: f.userName, message: f.message, createdAt: f.createdAt }));
}
