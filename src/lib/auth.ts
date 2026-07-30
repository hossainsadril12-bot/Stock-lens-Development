import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export const USER_COOKIE = "sl_user";

export type Role = "admin" | "staff" | "viewer";
export type SessionUser = { id: number; name: string; email: string; role: Role };

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin / Owner",
  staff: "Staff",
  viewer: "Viewer",
};

export async function getUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const email = store.get(USER_COOKIE)?.value;
  if (!email) return null;
  const rows = await db.select().from(users).where(eq(users.email, email));
  const u = rows[0];
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role as Role };
}
