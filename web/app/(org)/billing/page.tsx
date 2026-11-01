import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { BillingSection } from "./_components/billing-section";

export default async function BillingPage() {
  const t = await getTranslations("Billing");

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader force title={t("title")} description={t("pageDescription")} />
      <BillingSection />
    </div>
  );
}
