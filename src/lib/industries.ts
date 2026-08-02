import {
  Boxes,
  Building2,
  Wrench,
  KeySquare,
  Package,
  type LucideIcon,
} from "lucide-react";

export type Tone = "ok" | "warn" | "danger" | "info" | "neutral";
export type StatusDef = { label: string; tone: Tone };
export type Column = {
  key: string;
  label: string;
  format?: "text" | "num" | "money" | "seats" | "components";
  muted?: boolean;
  kind?: "status";
};

export type IndustryKey = "physical" | "real_estate" | "equipment" | "digital" | "kit";

export type Industry = {
  key: IndustryKey;
  label: string;
  noun: string; // plural noun for counts ("products", "units")
  description: string;
  Icon: LucideIcon;
  categoriesType: string;
  statuses: Record<string, StatusDef>;
  columns: Column[];
};

const STATUS: Record<string, StatusDef> = {
  // physical
  in_stock: { label: "In stock", tone: "ok" },
  low_stock: { label: "Low stock", tone: "warn" },
  out_of_stock: { label: "Out of stock", tone: "danger" },
  discontinued: { label: "Discontinued", tone: "neutral" },
  // real estate
  available: { label: "Available", tone: "ok" },
  reserved: { label: "Reserved", tone: "warn" },
  sold: { label: "Sold", tone: "info" },
  off_market: { label: "Off market", tone: "neutral" },
  // equipment
  in_use: { label: "In use", tone: "info" },
  under_maintenance: { label: "Maintenance", tone: "warn" },
  retired: { label: "Retired", tone: "neutral" },
  // digital
  active: { label: "Active", tone: "ok" },
  assigned: { label: "Assigned", tone: "info" },
  expired: { label: "Expired", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

function pick(keys: string[]): Record<string, StatusDef> {
  return Object.fromEntries(keys.map((k) => [k, STATUS[k]]));
}

export const INDUSTRIES: Record<IndustryKey, Industry> = {
  physical: {
    key: "physical",
    label: "Physical Products",
    noun: "products",
    description: "Stock, batches, serials and reorder points across your warehouses.",
    Icon: Boxes,
    categoriesType: "physical",
    statuses: pick(["in_stock", "low_stock", "out_of_stock", "discontinued"]),
    columns: [
      { key: "name", label: "Item" },
      { key: "sku", label: "SKU", muted: true },
      { key: "categoryName", label: "Category" },
      { key: "available", label: "Available", format: "num" },
      { key: "onHand", label: "On hand", format: "num", muted: true },
      { key: "reorderPoint", label: "Reorder", format: "num", muted: true },
      { key: "statusKey", label: "Status", kind: "status" },
    ],
  },
  real_estate: {
    key: "real_estate",
    label: "Real Estate",
    noun: "units",
    description: "Buildings, blocks, floors and units with a sale lifecycle.",
    Icon: Building2,
    categoriesType: "real_estate",
    statuses: pick(["available", "reserved", "sold", "off_market"]),
    columns: [
      { key: "name", label: "Unit" },
      { key: "attrs.floor", label: "Floor", format: "num" },
      { key: "attrs.bedrooms", label: "Beds", format: "num" },
      { key: "attrs.area_sqft", label: "Area (sqft)", format: "num" },
      { key: "price", label: "Price", format: "money" },
      { key: "statusKey", label: "Status", kind: "status" },
    ],
  },
  equipment: {
    key: "equipment",
    label: "Equipment & Assets",
    noun: "assets",
    description: "Owned tools, vehicles and devices — tracked by assignment and condition.",
    Icon: Wrench,
    categoriesType: "equipment",
    statuses: pick(["available", "in_use", "under_maintenance", "retired"]),
    columns: [
      { key: "name", label: "Asset" },
      { key: "sku", label: "Tag", muted: true },
      { key: "attrs.condition", label: "Condition" },
      { key: "attrs.assigned_to", label: "Assigned to" },
      { key: "statusKey", label: "Status", kind: "status" },
    ],
  },
  digital: {
    key: "digital",
    label: "Digital & Services",
    noun: "licenses",
    description: "Licences, subscriptions and service packages — seats and expiry.",
    Icon: KeySquare,
    categoriesType: "digital",
    statuses: pick(["active", "assigned", "expired", "cancelled"]),
    columns: [
      { key: "name", label: "License" },
      { key: "seats", label: "Seats", format: "seats" },
      { key: "attrs.expiry_date", label: "Expiry" },
      { key: "price", label: "Annual", format: "money" },
      { key: "statusKey", label: "Status", kind: "status" },
    ],
  },
  kit: {
    key: "kit",
    label: "Kits & Bundles",
    noun: "kits",
    description: "Composite items assembled from other StockLens items.",
    Icon: Package,
    categoriesType: "kit",
    statuses: pick(["active", "discontinued"]),
    columns: [
      { key: "name", label: "Kit" },
      { key: "sku", label: "SKU", muted: true },
      { key: "components", label: "Components", format: "components" },
      { key: "price", label: "Price", format: "money" },
      { key: "statusKey", label: "Status", kind: "status" },
    ],
  },
};

export const INDUSTRY_LIST: Industry[] = [
  INDUSTRIES.physical,
  INDUSTRIES.real_estate,
  INDUSTRIES.equipment,
  INDUSTRIES.digital,
  INDUSTRIES.kit,
];

export function getIndustry(key: string): Industry {
  return INDUSTRIES[(key as IndustryKey)] ?? INDUSTRIES.physical;
}
