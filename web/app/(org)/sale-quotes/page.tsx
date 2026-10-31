import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { SaleQuotesSection } from "./_components/sale-quotes-section";

export default async function OrgSaleQuotesPage() {
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Sales");
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("quotesTitle")} description={t("quotesSubtitle")} />
      <SaleQuotesSection orgId={id} />
    </div>
  );
}
