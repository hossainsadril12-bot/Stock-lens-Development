"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthState } from "@/app/actions";
import styles from "@/components/auth.module.css";

export default function SignUpForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, {});

  return (
    <div className={styles.card}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden>SL</span>
        <span className={styles.brandName}>StockLens</span>
      </div>
      <h1 className={styles.h1}>Create your account</h1>
      <p className={styles.lede}>Set up a StockLens login, then pick your workspace.</p>

      <form action={formAction} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Full name</label>
          <input className={styles.input} id="name" name="name" type="text" autoComplete="name" placeholder="Your name" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">Email</label>
          <input className={styles.input} id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">Password</label>
          <input className={styles.input} id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 6 characters" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="role">Role</label>
          <select className={styles.select} id="role" name="role" defaultValue="admin">
            <option value="admin">Admin / Owner</option>
            <option value="staff">Staff</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        {state?.error && <p className={styles.error}>{state.error}</p>}
        <button className={styles.primary} type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className={styles.alt}>
        Already have an account? <Link className={styles.altLink} href="/login">Sign in</Link>
      </p>
    </div>
  );
}
