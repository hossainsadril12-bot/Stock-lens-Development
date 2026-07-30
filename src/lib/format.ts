const nf = new Intl.NumberFormat("en-US");

export function num(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return nf.format(n);
}

export function money(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `৳${nf.format(n)}`; // ৳ (BDT)
}

export function moneyCompact(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}k`;
  return `৳${nf.format(n)}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function date(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const TODAY = new Date("2026-07-30T00:00:00Z"); // fixed demo "today"

export function daysBetween(iso: string): number {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : iso);
  return Math.round((TODAY.getTime() - d.getTime()) / 86_400_000);
}

export function daysUntil(iso: string): number {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : iso);
  return Math.round((d.getTime() - TODAY.getTime()) / 86_400_000);
}
