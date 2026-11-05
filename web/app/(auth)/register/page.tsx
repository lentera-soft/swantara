import Link from "next/link";
import { getTranslations } from "next-intl/server";
import AuthShell from "../_components/auth-shell";
import RegisterForm from "./_components/register-form";

export default async function RegisterPage() {
  const t = await getTranslations("Auth");
  return (
    <AuthShell title={t("registerTitle")} subtitle={t("registerSubtitle")}>
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link
          className="inline-flex min-h-11 items-center rounded-full px-1 font-medium text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/login"
        >
          {t("loginButton")}
        </Link>
      </p>
    </AuthShell>
  );
}
