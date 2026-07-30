"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, demoLogin, type AuthState } from "@/app/actions";
import styles from "@/components/auth.module.css";

const DEMO: [string, string][] = [
  ["admin", "Anwar · Admin"],
  ["staff", "Rahim · Staff"],
  ["viewer", "Salam · Viewer"],
];

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, {});

  return (
    <div className={styles.card}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden>SL</span>
        <span className={styles.brandName}>StockLens</span>
      </div>
      <h1 className={styles.h1}>Sign in</h1>
      <p className={styles.lede}>Welcome back. Sign in to your workspace.</p>

      <form action={formAction} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">Email</label>
          <input className={styles.input} id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">Password</label>
          <input className={styles.input} id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
        </div>
        {state?.error && <p className={styles.error}>{state.error}</p>}
        <button className={styles.primary} type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className={styles.demoWrap}>
        <p className={styles.demoLabel}>Or try a demo role (password-free)</p>
        <div className={styles.demoRow}>
          {DEMO.map(([role, label]) => (
            <form key={role} action={demoLogin}>
              <input type="hidden" name="role" value={role} />
              <button className={styles.demoBtn} type="submit">
                {label}
              </button>
            </form>
          ))}
        </div>
      </div>

      <p className={styles.alt}>
        New here? <Link className={styles.altLink} href="/sign-up">Create an account</Link>
      </p>
    </div>
  );
}
