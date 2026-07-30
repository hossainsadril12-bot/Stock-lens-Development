import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import SignUpForm from "./SignUpForm";
import styles from "@/components/auth.module.css";

export default async function SignUpPage() {
  if (await getUser()) redirect("/onboarding");
  return (
    <div className={styles.screen}>
      <SignUpForm />
    </div>
  );
}
