"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { USER_COOKIE, type Role } from "@/lib/auth";
import { INDUSTRY_COOKIE, INDUSTRIES_COOKIE, getAllowedIndustries } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type AuthState = { error?: string };

async function startSession(email: string) {
  const store = await cookies();
  store.set(USER_COOKIE, email, { path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const rows = await db.select().from(users).where(eq(users.email, email));
  const u = rows[0];
  if (!u || u.password !== password) return { error: "Wrong email or password." };

  await startSession(u.email);
  redirect("/onboarding");
}

export async function demoLogin(formData: FormData) {
  const role = String(formData.get("role") ?? "") as Role;
  const rows = await db.select().from(users).where(eq(users.role, role));
  const u = rows[0];
  if (!u) redirect("/login");
  await startSession(u.email);
  redirect("/onboarding");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = (String(formData.get("role") ?? "admin") as Role) || "admin";

  if (!name || !email) return { error: "Enter your name and email." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing[0]) return { error: "That email is already registered — try signing in." };

  await db.insert(users).values({
    name,
    email,
    password,
    role,
    createdAt: new Date().toISOString(),
  });
  await startSession(email);
  redirect("/onboarding");
}

export async function logout() {
  const store = await cookies();
  store.delete(USER_COOKIE);
  store.delete(INDUSTRY_COOKIE);
  redirect("/login");
}

const COOKIE_OPTS = { path: "/", maxAge: 60 * 60 * 24 * 30 };

// Setup: user picks one or more industries they manage. First becomes active.
export async function chooseIndustries(keys: string[]) {
  const clean = Array.from(new Set(keys.filter(Boolean)));
  if (clean.length === 0) return;
  const store = await cookies();
  store.set(INDUSTRIES_COOKIE, clean.join(","), COOKIE_OPTS);
  store.set(INDUSTRY_COOKIE, clean[0], COOKIE_OPTS);
  // First-run: offer a CSV import step before the (possibly empty) dashboard.
  redirect("/onboarding/import");
}

// Switch the active industry (only among the ones the user chose).
export async function setActiveIndustry(key: string) {
  const allowed = await getAllowedIndustries();
  if (!allowed.includes(key as (typeof allowed)[number])) return;
  const store = await cookies();
  store.set(INDUSTRY_COOKIE, key, COOKIE_OPTS);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
