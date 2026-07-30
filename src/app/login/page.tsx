import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import LoginForm from "./LoginForm";
import styles from "@/components/auth.module.css";

export default async function LoginPage() {
  if (await getUser()) redirect("/onboarding");
  return (
    <div className={styles.screen}>
      <LoginForm />
    </div>
  );
}
