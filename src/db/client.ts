import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./stocklens.db";

// Reuse the client across hot-reloads in dev to avoid exhausting file handles.
const globalForDb = globalThis as unknown as {
  __libsqlClient?: ReturnType<typeof createClient>;
};

const client = globalForDb.__libsqlClient ?? createClient({ url });
if (process.env.NODE_ENV !== "production") globalForDb.__libsqlClient = client;

export const db = drizzle(client, { schema });
export { schema };
