import { redirect } from "next/navigation";
import { getUser, ROLE_LABEL } from "@/lib/auth";
import { logout } from "@/app/actions";
import IndustryPicker from "@/components/IndustryPicker";
import styles from "./onboarding.module.css";

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const firstName = user.name.split(" ")[0];

  return (
    <div className={styles.screen}>
      <div className={styles.panel}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden>SL</span>
          <span className={styles.brandName}>StockLens</span>
        </div>

        <p className={styles.welcome}>Welcome, {firstName}</p>
        <h1 className={styles.h1}>Set up your workspace</h1>
        <p className={styles.lede}>
          StockLens shapes itself to what you track — columns, statuses and metrics all follow your
          industry. Pick every industry you manage; you can switch between them any time from the top bar.
        </p>

        <IndustryPicker />

        <div className={styles.foot}>
          <span>
            Signed in as <strong>{user.name}</strong> · {ROLE_LABEL[user.role]}
          </span>
          <form action={logout}>
            <button className={styles.logout} type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
