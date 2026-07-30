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
  leadTimeDays: integer("lead_time_days").notNull().default(7),
});

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  name: text("name").notNull(),
  sku: text("sku"),
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
  status: text("status").notNull(), // in_transit | received
  vehicle: text("vehicle"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  dispatchedAt: text("dispatched_at").notNull(),
  expectedDate: text("expected_date"),
  receivedAt: text("received_at"),
  createdBy: text("created_by"),
});

export type User = typeof users.$inferSelect;
export type TransferOrder = typeof transferOrders.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Stock = typeof stock.$inferSelect;
export type Movement = typeof movements.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
