import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { getIndustryKey, hasIndustry } from "@/lib/session";
import { getIndustry } from "@/lib/industries";
import CsvImport from "@/components/CsvImport";
import styles from "../onboarding.module.css";

export default async function OnboardingImportPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  // Reached only after an industry is chosen.
  if (!(await hasIndustry())) redirect("/onboarding");

  const key = await getIndustryKey();
  const ind = getIndustry(key);

  return (
    <div className={styles.screen}>
      <div className={styles.panel} style={{ maxWidth: 760, width: "100%" }}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden>SL</span>
          <span className={styles.brandName}>StockLens</span>
        </div>

        <h1 className={styles.h1}>Bring in your {ind.noun}</h1>
        <p className={styles.lede}>
          Already have your {ind.noun} in a spreadsheet? Upload a CSV to fill your dashboard now —
          or skip and add items later. You can import any time from the Items page.
        </p>

        <CsvImport type={key} redirectTo="/dashboard" />

        <div className={styles.foot}>
          <span>Not ready? You can do this later.</span>
          <Link className={styles.logout} href="/dashboard">Skip for now</Link>
        </div>
      </div>
    </div>
  );
}
