import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

// Item types per PRD §3: real_estate | physical | equipment | digital | kit
export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  kind: text("kind").notNull(), // warehouse | property | depot
  parentId: integer("parent_id"), // hub -> sub-warehouse (null = top-level / hub)
  city: text("city"),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(), // which item type this category groups
});

export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
  leadTimeDays: integer("lead_time_days").notNull().default(7),
});

// Drivers are not system users — they don't log in, just a name + phone
// referenced by vehicles / transfers.
export const drivers = sqliteTable("drivers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
});

export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(), // e.g. "Truck DHA-11-2345"
  assignedDriverId: integer("assigned_driver_id"),
});

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  name: text("name").notNull(),
  sku: text("sku"),
  barcode: text("barcode"), // scanned code (EAN/UPC/Code128); lookup key for scan stock-in
  categoryId: integer("category_id"),
  status: text("status"), // real_estate/equipment/digital carry an explicit status; physical is derived
  price: real("price"),
  reorderPoint: integer("reorder_point"), // physical only
  primaryLocationId: integer("primary_location_id"),
  attrs: text("attrs"), // JSON string of type-specific fields (PRD §3 attribute sets)
  createdAt: text("created_at").notNull(),
});

// Denormalised stock per location for physical/equipment. The movements table is the ledger.
export const stock = sqliteTable("stock", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: integer("item_id").notNull(),
  locationId: integer("location_id").notNull(),
  onHand: integer("on_hand").notNull().default(0),
  reserved: integer("reserved").notNull().default(0),
});

export const movements = sqliteTable("movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: integer("item_id").notNull(),
  locationId: integer("location_id").notNull(),
  type: text("type").notNull(), // stock_in | stock_out | reserve | release | adjust
  quantity: integer("quantity").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});

export const purchaseOrders = sqliteTable("purchase_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  supplierId: integer("supplier_id"),
  status: text("status").notNull(), // draft | pending_approval | approved | sent | received
  total: real("total").notNull().default(0),
  itemId: integer("item_id"), // linked stock item, so receipt can auto stock-in
  itemSummary: text("item_summary"),
  qty: integer("qty"),
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull(),
  expectedDate: text("expected_date"),
});

// Demo accounts (roles per PRD §4). NOTE: demo-only auth — plaintext password,
// not production-grade. Fine for a local wireframe prototype.
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // admin | staff | viewer
  createdAt: text("created_at").notNull(),
});

// Internal stock transfer between the hub and sub-warehouses, carried by the
// company's own transport (vehicle + driver). No supplier. Courier NOT used.
export const transferOrders = sqliteTable("transfer_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  itemId: integer("item_id"),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  fromLocationId: integer("from_location_id").notNull(),
  toLocationId: integer("to_location_id").notNull(),
  status: text("status").notNull(), // requested | in_transit | received | rejected
  vehicleId: integer("vehicle_id"), // snapshot fields below carry the label/driver at dispatch time
  vehicle: text("vehicle"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  requestedBy: text("requested_by"),
  requestedAt: text("requested_at"),
  rejectedAt: text("rejected_at"),
  dispatchedAt: text("dispatched_at"), // null while status = requested
  expectedDate: text("expected_date"),
  receivedAt: text("received_at"),
  createdBy: text("created_by"), // who dispatched it (admin)
});

// In-app notifications (e.g. staff received a transfer). Shown in the top-bar bell.
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  message: text("message").notNull(),
  kind: text("kind"), // transfer_received | sale | ...
  read: integer("read").notNull().default(0), // 0 = unread
  createdAt: text("created_at").notNull(),
});

// Customer sale / issue-out — HEADER. One receipt, many line items.
export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  customerName: text("customer_name").notNull(),
  total: real("total").notNull().default(0),
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull(),
});

// User-submitted feedback / problem reports from the in-app guide.
export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userName: text("user_name"),
  message: text("message").notNull(),
  handled: integer("handled").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

// One product line on a sale. Stock is deducted per line.
export const saleItems = sqliteTable("sale_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id").notNull(),
  itemId: integer("item_id"),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price"),
  lineTotal: real("line_total"),
});

export type User = typeof users.$inferSelect;
export type TransferOrder = typeof transferOrders.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Stock = typeof stock.$inferSelect;
export type Movement = typeof movements.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
