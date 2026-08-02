import type { Role } from "./auth";

export type Action =
  | "item.create"
  | "item.edit"
  | "item.delete"
  | "po.create"
  | "po.approve"
  | "stock.move"
  | "transfer.create"
  | "transfer.request"
  | "transfer.approve"
  | "transfer.receive"
  | "transfer.notify"
  | "team.manage"
  | "export";

const MATRIX: Record<Role, Action[]> = {
  admin: ["item.create", "item.edit", "item.delete", "po.create", "po.approve", "stock.move", "transfer.create", "transfer.approve", "transfer.notify", "team.manage", "export"],
  staff: ["item.create", "item.edit", "po.create", "stock.move", "transfer.request", "transfer.receive", "export"],
  viewer: ["export"],
};

export function can(role: Role, action: Action): boolean {
  return MATRIX[role].includes(action);
}

export type NavKey =
  | "dashboard"
  | "items"
  | "transfers"
  | "purchase_orders"
  | "suppliers"
  | "employees"
  | "transport"
  | "locations"
  | "categories"
  | "reports"
  | "settings";

const NAV: Record<Role, NavKey[]> = {
  admin: ["dashboard", "items", "transfers", "purchase_orders", "suppliers", "employees", "transport", "locations", "categories", "reports", "settings"],
  staff: ["dashboard", "items", "transfers", "purchase_orders", "locations", "reports", "settings"],
  viewer: ["dashboard", "items", "reports", "settings"],
};

export function canSeeNav(role: Role, key: NavKey): boolean {
  return NAV[role].includes(key);
}
