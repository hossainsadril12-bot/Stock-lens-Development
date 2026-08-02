import type { Config } from "drizzle-kit";

// Local SQLite file via libSQL. Schema is also created directly by src/db/seed.ts,
// so drizzle-kit is optional here — kept for future migration generation.
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./stocklens.db",
  },
} satisfies Config;
