import { cookies } from "next/headers";
import type { IndustryKey } from "./industries";

export const INDUSTRY_COOKIE = "sl_industry"; // the ACTIVE industry
export const INDUSTRIES_COOKIE = "sl_industries"; // comma list of industries the user manages

// The industries the user chose at setup. Falls back to the single active one.
export async function getAllowedIndustries(): Promise<IndustryKey[]> {
  const store = await cookies();
  const list = store.get(INDUSTRIES_COOKIE)?.value;
  if (list) {
    const keys = list.split(",").map((k) => k.trim()).filter(Boolean) as IndustryKey[];
    if (keys.length) return keys;
  }
  const single = store.get(INDUSTRY_COOKIE)?.value as IndustryKey | undefined;
  return single ? [single] : [];
}

export async function getIndustryKey(): Promise<IndustryKey> {
  const store = await cookies();
  const active = store.get(INDUSTRY_COOKIE)?.value as IndustryKey | undefined;
  if (active) return active;
  const allowed = await getAllowedIndustries();
  return allowed[0] ?? "physical";
}

// Setup complete once the user has picked at least one industry.
export async function hasIndustry(): Promise<boolean> {
  const store = await cookies();
  return Boolean(store.get(INDUSTRY_COOKIE)?.value || store.get(INDUSTRIES_COOKIE)?.value);
}
