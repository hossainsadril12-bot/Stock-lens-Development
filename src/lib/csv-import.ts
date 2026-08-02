// Shared CSV-import spec + validation. Pure (no DB) so both the client preview
// and the server import action use the exact same rules. Category resolution
// (needs DB) happens server-side in importItems().
import { getIndustry } from "./industries";

export type ImportType = "physical" | "real_estate";

export const IMPORTABLE_TYPES: ImportType[] = ["physical", "real_estate"];

type ColKind = "text" | "int" | "float" | "bool" | "status";
type ColSpec = { key: string; required?: boolean; kind: ColKind; sample: string };

// Column order = template column order. Header row uses the `key` verbatim.
export const IMPORT_COLUMNS: Record<ImportType, ColSpec[]> = {
  physical: [
    { key: "name", required: true, kind: "text", sample: "A4 Premium Paper" },
    { key: "sku", kind: "text", sample: "PAP-A4-PRM" },
    { key: "barcode", kind: "text", sample: "2000000000101" },
    { key: "category", kind: "text", sample: "Paper" },
    { key: "quantity", kind: "int", sample: "150" },
    { key: "reorder_point", kind: "int", sample: "200" },
    { key: "unit_of_measure", kind: "text", sample: "ream" },
    { key: "price", kind: "float", sample: "5.50" },
  ],
  real_estate: [
    { key: "name", required: true, kind: "text", sample: "Unit A-101" },
    { key: "category", kind: "text", sample: "Rio Tower Residential" },
    { key: "block", kind: "text", sample: "A" },
    { key: "floor", kind: "int", sample: "1" },
    { key: "bedrooms", kind: "int", sample: "3" },
    { key: "bathrooms", kind: "int", sample: "2" },
    { key: "area_sqft", kind: "int", sample: "1450" },
    { key: "price", kind: "float", sample: "8500000" },
    { key: "status", kind: "status", sample: "available" },
    { key: "furnished", kind: "bool", sample: "no" },
  ],
};

export type ParsedRow = Record<string, string | number | boolean | null>;
export type RowError = { row: number; reason: string };
export type ParseResult = { valid: ParsedRow[]; errors: RowError[]; total: number };

const BOOL_TRUE = new Set(["yes", "y", "true", "1"]);
const BOOL_FALSE = new Set(["no", "n", "false", "0", ""]);

function statusKeys(type: ImportType): string[] {
  return Object.keys(getIndustry(type).statuses);
}

// Build the downloadable template: header row + one sample data row.
export function buildTemplateCsv(type: ImportType): string {
  const cols = IMPORT_COLUMNS[type];
  const header = cols.map((c) => c.key).join(",");
  const sample = cols.map((c) => c.sample).join(",");
  return `${header}\n${sample}\n`;
}

// Normalise a raw parsed row (keys may vary in case/whitespace) into a lookup.
function normalise(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k.trim().toLowerCase()] = v == null ? "" : String(v).trim();
  }
  return out;
}

// Validate + type-convert raw CSV rows against the industry column spec.
// rowOffset: data row number of rawRows[0] (for human-readable error rows).
export function parseAndValidate(type: ImportType, rawRows: Record<string, unknown>[]): ParseResult {
  const cols = IMPORT_COLUMNS[type];
  const validStatuses = statusKeys(type);
  const valid: ParsedRow[] = [];
  const errors: RowError[] = [];
  let total = 0;

  rawRows.forEach((raw, i) => {
    const rowNum = i + 1;
    const cells = normalise(raw);
    // Skip fully blank lines.
    if (cols.every((c) => !cells[c.key])) return;
    total++;

    const out: ParsedRow = {};
    const rowErrors: string[] = [];

    for (const c of cols) {
      const v = cells[c.key] ?? "";
      if (c.required && v === "") {
        rowErrors.push(`${c.key} is required`);
        out[c.key] = null;
        continue;
      }
      if (v === "") {
        out[c.key] = c.kind === "bool" ? false : null;
        continue;
      }
      switch (c.kind) {
        case "text":
          out[c.key] = v;
          break;
        case "int":
        case "float": {
          const n = Number(v);
          if (Number.isNaN(n)) rowErrors.push(`${c.key} "${v}" is not a number`);
          out[c.key] = Number.isNaN(n) ? null : c.kind === "int" ? Math.trunc(n) : n;
          break;
        }
        case "bool": {
          const lv = v.toLowerCase();
          if (BOOL_TRUE.has(lv)) out[c.key] = true;
          else if (BOOL_FALSE.has(lv)) out[c.key] = false;
          else rowErrors.push(`${c.key} "${v}" must be yes/no`);
          break;
        }
        case "status": {
          const lv = v.toLowerCase();
          if (!validStatuses.includes(lv)) rowErrors.push(`status "${v}" must be one of: ${validStatuses.join(", ")}`);
          else out[c.key] = lv;
          break;
        }
      }
    }

    if (rowErrors.length) errors.push({ row: rowNum, reason: rowErrors.join("; ") });
    else valid.push(out);
  });

  return { valid, errors, total };
}
