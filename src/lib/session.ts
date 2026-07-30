import { cookies } from "next/headers";
import type { IndustryKey } from "./industries";

export const INDUSTRY_COOKIE = "sl_industry";

export async function getIndustryKey(): Promise<IndustryKey> {
  const store = await cookies();
  const v = store.get(INDUSTRY_COOKIE)?.value;
  return (v as IndustryKey) ?? "physical";
}

export async function hasIndustry(): Promise<boolean> {
  const store = await cookies();
  return Boolean(store.get(INDUSTRY_COOKIE)?.value);
}
