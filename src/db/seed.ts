import { createClient, type InArgs } from "@libsql/client";

// Standalone seed script. Creates the schema and plants the demo company
// "Anwar Supplies & Properties" so the client sees real, queried data.
// Run with: npm run db:seed

const url = process.env.DATABASE_URL ?? "file:./stocklens.db";
const client = createClient({ url });

// Fixed "today" so demo relative dates ("low for 3 days") stay stable.
const TODAY = "2026-07-30";
function daysAgo(n: number): string {
  const d = new Date(`${TODAY}T09:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const DDL = `
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS transfer_orders;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS movements;
DROP TABLE IF EXISTS stock;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  parent_id INTEGER,
  city TEXT
);
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL
);
CREATE TABLE suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  lead_time_days INTEGER NOT NULL DEFAULT 7
);
CREATE TABLE drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT
);
CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  assigned_driver_id INTEGER
);
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  category_id INTEGER,
  status TEXT,
  price REAL,
  reorder_point INTEGER,
  primary_location_id INTEGER,
  attrs TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  on_hand INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  supplier_id INTEGER,
  status TEXT NOT NULL,
  total REAL NOT NULL DEFAULT 0,
  item_id INTEGER,
  item_summary TEXT,
  qty INTEGER,
  created_by TEXT,
  created_at TEXT NOT NULL,
  expected_date TEXT
);
CREATE TABLE transfer_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  item_id INTEGER,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  from_location_id INTEGER NOT NULL,
  to_location_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  vehicle_id INTEGER,
  vehicle TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  requested_by TEXT,
  requested_at TEXT,
  rejected_at TEXT,
  dispatched_at TEXT,
  expected_date TEXT,
  received_at TEXT,
  created_by TEXT
);
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  kind TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  total REAL NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  item_id INTEGER,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL,
  line_total REAL
);
CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT,
  message TEXT NOT NULL,
  handled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
`;

type Stmt = { sql: string; args: InArgs };
const stmts: Stmt[] = [];
const add = (sql: string, args: InArgs) => stmts.push({ sql, args });

// --- Users (demo accounts, one per PRD role) ---
const demoUsers: [string, string, string, string][] = [
  // name, email, password, role
  ["Anwar Hossain", "anwar@anwarsupplies.com", "demo1234", "admin"],
  ["Rahim Uddin", "rahim@anwarsupplies.com", "demo1234", "staff"],
  ["Salam Khan", "salam@investor.com", "demo1234", "viewer"],
];
for (const [name, email, password, role] of demoUsers)
  add("INSERT INTO users (name,email,password,role,created_at) VALUES (?,?,?,?,?)", [name, email, password, role, daysAgo(60)]);

// --- Locations: Main hub (Dhaka) + sub-warehouses by city ---
add("INSERT INTO locations (id,name,kind,parent_id,city) VALUES (?,?,?,?,?)", [1, "Main Warehouse", "warehouse", null, "Dhaka"]);
add("INSERT INTO locations (id,name,kind,parent_id,city) VALUES (?,?,?,?,?)", [2, "Rio Tower", "property", null, "Dhaka"]);
add("INSERT INTO locations (id,name,kind,parent_id,city) VALUES (?,?,?,?,?)", [3, "Chittagong Sub-Warehouse", "warehouse", 1, "Chittagong"]);
add("INSERT INTO locations (id,name,kind,parent_id,city) VALUES (?,?,?,?,?)", [4, "Sylhet Sub-Warehouse", "warehouse", 1, "Sylhet"]);
add("INSERT INTO locations (id,name,kind,parent_id,city) VALUES (?,?,?,?,?)", [5, "Khulna Sub-Warehouse", "warehouse", 1, "Khulna"]);

// --- Categories ---
const cats: [number, string, string][] = [
  [1, "Paper", "physical"],
  [2, "Ink & Toner", "physical"],
  [3, "Packaging", "physical"],
  [4, "Material Handling", "equipment"],
  [5, "Devices", "equipment"],
  [6, "Rio Tower Residential", "real_estate"],
  [7, "Software", "digital"],
  [8, "Bundles", "kit"],
];
for (const [id, name, type] of cats)
  add("INSERT INTO categories (id,name,type) VALUES (?,?,?)", [id, name, type]);

// --- Suppliers ---
add("INSERT INTO suppliers (id,name,phone,lead_time_days) VALUES (?,?,?,?)", [1, "PaperCo", "+8801711-201201", 5]);
add("INSERT INTO suppliers (id,name,phone,lead_time_days) VALUES (?,?,?,?)", [2, "InkWorld", "+8801822-405406", 7]);

// --- Drivers & vehicles (own transport fleet for transfers) ---
add("INSERT INTO drivers (id,name,phone) VALUES (?,?,?)", [1, "Karim Ali", "+8801711-000111"]);
add("INSERT INTO drivers (id,name,phone) VALUES (?,?,?)", [2, "Jamal Uddin", "+8801822-333444"]);
add("INSERT INTO drivers (id,name,phone) VALUES (?,?,?)", [3, "Jasim Uddin", "+8801933-555666"]);

add("INSERT INTO vehicles (id,label,assigned_driver_id) VALUES (?,?,?)", [1, "Truck DHA-11-2345", 1]);
add("INSERT INTO vehicles (id,label,assigned_driver_id) VALUES (?,?,?)", [2, "Pickup CTG-3-9911", 2]);
add("INSERT INTO vehicles (id,label,assigned_driver_id) VALUES (?,?,?)", [3, "Truck DHA-22-9090", 3]);
add("INSERT INTO vehicles (id,label,assigned_driver_id) VALUES (?,?,?)", [4, "Van SYL-7-1120", null]);

// --- Items ---
type ItemRow = {
  id: number; type: string; name: string; sku: string | null; barcode: string | null; categoryId: number | null;
  status: string | null; price: number | null; reorder: number | null; loc: number | null;
  attrs: Record<string, unknown> | null; created: string;
};
const itemRows: ItemRow[] = [];
// Deterministic demo barcode: 13-digit EAN-style, "200" prefix + zero-padded id.
const demoBarcode = (id: number) => `200${String(id).padStart(10, "0")}`;
const item = (r: Partial<ItemRow> & { id: number; type: string; name: string }) => {
  // physical + equipment items carry a scannable barcode; others (real_estate/digital/kit) don't.
  const barcode = r.barcode ?? (r.type === "physical" || r.type === "equipment" ? demoBarcode(r.id) : null);
  itemRows.push({
    sku: null, categoryId: null, status: null, price: null, reorder: null,
    loc: null, attrs: null, created: daysAgo(120), ...r, barcode,
  });
};

// Physical (1..8)
item({ id: 1, type: "physical", name: "A4 Premium Paper", sku: "PAP-A4-PRM", categoryId: 1, price: 5.5, reorder: 200, loc: 1, attrs: { unit_of_measure: "ream", tracking_mode: "batch" } });
item({ id: 2, type: "physical", name: "A4 Standard Paper", sku: "PAP-A4-STD", categoryId: 1, price: 3.2, reorder: 300, loc: 1, attrs: { unit_of_measure: "ream", tracking_mode: "none" } });
item({ id: 3, type: "physical", name: "A3 Paper", sku: "PAP-A3", categoryId: 1, price: 6.8, reorder: 100, loc: 1, attrs: { unit_of_measure: "ream", tracking_mode: "none" } });
item({ id: 4, type: "physical", name: "Black Ink Cartridge", sku: "INK-BLK", categoryId: 2, price: 42, reorder: 20, loc: 1, attrs: { unit_of_measure: "unit", tracking_mode: "serial" } });
item({ id: 5, type: "physical", name: "Cyan Ink Cartridge", sku: "INK-CYN", categoryId: 2, price: 39, reorder: 15, loc: 1, attrs: { unit_of_measure: "unit", tracking_mode: "serial" } });
item({ id: 6, type: "physical", name: "Packaging Box (Large)", sku: "PKG-BOX-L", categoryId: 3, price: 1.1, reorder: 200, loc: 1, attrs: { unit_of_measure: "unit", tracking_mode: "none" } });
item({ id: 7, type: "physical", name: "Packaging Tape", sku: "PKG-TAPE", categoryId: 3, price: 2.4, reorder: 30, loc: 1, attrs: { unit_of_measure: "roll", tracking_mode: "none" } });
item({ id: 8, type: "physical", name: "Glossy Photo Paper", sku: "PAP-GLOSS", categoryId: 1, price: 12, reorder: 50, loc: 1, attrs: { unit_of_measure: "pack", tracking_mode: "batch" } });

// Equipment (9..12)
item({ id: 9, type: "equipment", name: "Forklift FL-01", sku: "EQ-FL-01", categoryId: 4, status: "in_use", loc: 1, attrs: { serial_number: "FL-01", condition: "good", assigned_to: "Rahim", last_serviced: daysAgo(40) } });
item({ id: 10, type: "equipment", name: "Label Printer LP-2", sku: "EQ-LP-2", categoryId: 5, status: "available", loc: 1, attrs: { serial_number: "LP-2", condition: "good", assigned_to: null, last_serviced: daysAgo(15) } });
item({ id: 11, type: "equipment", name: "Handheld Scanner SC-7", sku: "EQ-SC-7", categoryId: 5, status: "under_maintenance", loc: 1, attrs: { serial_number: "SC-7", condition: "needs repair", assigned_to: null, last_serviced: daysAgo(3) } });
item({ id: 12, type: "equipment", name: "Delivery Van V-3", sku: "EQ-V-3", categoryId: 4, status: "in_use", loc: 1, attrs: { serial_number: "V-3", condition: "fair", assigned_to: "Karim", last_serviced: daysAgo(70) } });

// Digital (13..16)
item({ id: 13, type: "digital", name: "StockLens Pro License", sku: "DIG-SL-PRO", categoryId: 7, status: "active", price: 1200, attrs: { seats: 25, seats_used: 18, expiry_date: "2026-12-31", vendor_url: "vantatrack.io" } });
item({ id: 14, type: "digital", name: "Accounting SaaS", sku: "DIG-ACCT", categoryId: 7, status: "active", price: 600, attrs: { seats: 5, seats_used: 5, expiry_date: "2026-09-15", vendor_url: "books.example.com" } });
item({ id: 15, type: "digital", name: "Design Suite", sku: "DIG-DSGN", categoryId: 7, status: "assigned", price: 900, attrs: { seats: 3, seats_used: 3, expiry_date: "2027-03-01", vendor_url: "design.example.com" } });
item({ id: 16, type: "digital", name: "Old CRM License", sku: "DIG-CRM", categoryId: 7, status: "expired", price: 0, attrs: { seats: 10, seats_used: 0, expiry_date: "2025-06-01", vendor_url: "crm.example.com" } });

// Real estate — Rio Tower, 24 units (ids 17..40): 18 sold, 3 reserved, 2 available, 1 off_market
let reId = 17;
for (let floor = 1; floor <= 8; floor++) {
  for (let n = 1; n <= 3; n++) {
    const unit = floor * 100 + n;
    let status = "sold";
    if (floor === 7) status = "reserved";
    else if (floor === 8 && n <= 2) status = "available";
    else if (floor === 8 && n === 3) status = "off_market";
    const bedrooms = n === 3 ? 3 : 2;
    const area = 850 + n * 120 + floor * 10;
    const price = 4_500_000 + floor * 150_000 + (bedrooms - 2) * 400_000;
    item({
      id: reId++, type: "real_estate", name: `Unit ${unit}`, sku: `RIO-${unit}`,
      categoryId: 6, status, price, loc: 2,
      attrs: { block: "A", floor, bedrooms, bathrooms: bedrooms, area_sqft: area, facing: n === 1 ? "east" : "west", furnished: floor >= 7 },
    });
  }
}

// Kit (41..42)
item({ id: 41, type: "kit", name: "Office Starter Pack", sku: "KIT-OFFICE", categoryId: 8, status: "active", price: 250, attrs: { components: ["A4 Premium Paper x2", "Black Ink Cartridge x1", "Packaging Box x5"] } });
item({ id: 42, type: "kit", name: "Furnished Flat Bundle", sku: "KIT-FLAT", categoryId: 8, status: "active", price: 5_200_000, attrs: { components: ["Rio Tower Unit x1", "Sofa Set x1", "Appliance Pack x1"] } });

for (const r of itemRows)
  add(
    "INSERT INTO items (id,type,name,sku,barcode,category_id,status,price,reorder_point,primary_location_id,attrs,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    [r.id, r.type, r.name, r.sku, r.barcode, r.categoryId, r.status, r.price, r.reorder, r.loc, r.attrs ? JSON.stringify(r.attrs) : null, r.created]
  );

// --- Stock (physical + equipment) ---
const stockRows: [number, number, number, number][] = [
  // itemId, locationId, onHand, reserved
  [1, 1, 150, 0], [1, 3, 400, 0], // A4 Premium: 150 at Main (low), 400 at Chittagong (Explore)
  [2, 1, 700, 50], // 100 of A4 Standard is in transit to Sylhet (TR-2001)
  [3, 1, 300, 0],
  [4, 1, 12, 0],  // Black Ink low
  [5, 1, 0, 0],   // Cyan out
  [6, 1, 1200, 0],
  [7, 1, 40, 0],
  [8, 1, 60, 10],
  [9, 1, 1, 0], [10, 1, 1, 0], [11, 1, 1, 0], [12, 1, 1, 0],
  [6, 3, 300, 0], // Packaging boxes delivered to Chittagong via TR-2000
  [4, 4, 8, 0],   // Black Ink low at Sylhet (reorder 20) — feeds the low-stock alert
];
for (const [itemId, locId, onHand, reserved] of stockRows)
  add("INSERT INTO stock (item_id,location_id,on_hand,reserved) VALUES (?,?,?,?)", [itemId, locId, onHand, reserved]);

// --- Movements (ledger sample) ---
const moves: [number, number, string, number, string, string][] = [
  [1, 1, "stock_in", 500, "PO-1039 received", daysAgo(12)],
  [1, 1, "stock_out", 200, "Counter sales", daysAgo(6)],
  [1, 1, "stock_out", 150, "Counter sales", daysAgo(2)],
  [2, 1, "stock_in", 1000, "Restock", daysAgo(20)],
  [2, 1, "reserve", 50, "Order #A-231", daysAgo(1)],
  [4, 1, "stock_out", 8, "Printing dept", daysAgo(4)],
  [5, 1, "stock_out", 15, "Printing dept", daysAgo(5)],
  [6, 1, "stock_in", 1500, "Restock", daysAgo(30)],
  [8, 1, "reserve", 10, "Order #A-240", daysAgo(1)],
];
for (const [itemId, locId, type, qty, note, created] of moves)
  add("INSERT INTO movements (item_id,location_id,type,quantity,note,created_at) VALUES (?,?,?,?,?,?)", [itemId, locId, type, qty, note, created]);

// --- Purchase orders ---
add("INSERT INTO purchase_orders (code,supplier_id,status,total,item_id,item_summary,qty,created_by,created_at,expected_date) VALUES (?,?,?,?,?,?,?,?,?,?)",
  ["PO-1042", 1, "pending_approval", 2750, 1, "A4 Premium Paper", 500, "Rahim", daysAgo(3), "2026-08-04"]);
add("INSERT INTO purchase_orders (code,supplier_id,status,total,item_id,item_summary,qty,created_by,created_at,expected_date) VALUES (?,?,?,?,?,?,?,?,?,?)",
  ["PO-1041", 2, "sent", 4200, 4, "Black Ink Cartridge", 100, "Anwar", daysAgo(5), "2026-08-01"]);
add("INSERT INTO purchase_orders (code,supplier_id,status,total,item_id,item_summary,qty,created_by,created_at,expected_date) VALUES (?,?,?,?,?,?,?,?,?,?)",
  ["PO-1039", 1, "received", 1600, 2, "A4 Standard Paper", 500, "Anwar", daysAgo(12), "2026-07-24"]);

// --- Transfers (hub -> sub-warehouse, own transport, no supplier) ---
const transfers: (string | number | null)[][] = [
  // code, item_id, item_name, qty, from, to, status, vehicle_id, vehicle, driver, phone, dispatched, expected, received, by
  ["TR-2001", 2, "A4 Standard Paper", 100, 1, 4, "in_transit", 1, "Truck DHA-11-2345", "Karim Ali", "+8801711-000111", daysAgo(2), "2026-08-01", null, "Anwar"],
  ["TR-2000", 6, "Packaging Box (Large)", 300, 1, 3, "received", 2, "Pickup CTG-3-9911", "Jamal Uddin", "+8801822-333444", daysAgo(9), daysAgo(7), daysAgo(7), "Anwar"],
];
for (const t of transfers)
  add(
    "INSERT INTO transfer_orders (code,item_id,item_name,quantity,from_location_id,to_location_id,status,vehicle_id,vehicle,driver_name,driver_phone,dispatched_at,expected_date,received_at,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    t
  );

// --- Transfer requests (staff-raised, awaiting Admin accept/reject) ---
const transferRequests: [string, number, string, number, number, string, string][] = [
  // code, item_id, item_name, qty, to_location_id, requested_by, requested_at
  ["TR-2002", 4, "Black Ink Cartridge", 30, 4, "Rahim", daysAgo(1)],
];
for (const [code, itemId, itemName, qty, toLoc, requestedBy, requestedAt] of transferRequests)
  add(
    "INSERT INTO transfer_orders (code,item_id,item_name,quantity,from_location_id,to_location_id,status,requested_by,requested_at) VALUES (?,?,?,?,?,?,?,?,?)",
    [code, itemId, itemName, qty, 1, toLoc, "requested", requestedBy, requestedAt]
  );

async function main() {
  await client.executeMultiple(DDL);
  await client.batch(stmts, "write");
  console.log(`Seeded ${demoUsers.length} users, ${itemRows.length} items, ${stockRows.length} stock rows, ${moves.length} movements, 3 POs, ${transfers.length} transfers, ${transferRequests.length} transfer requests into ${url}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
