import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { SaleQuoteDetail } from "./_components/sale-quote-detail-section";

export default async function OrgSaleQuoteDetailPage({
  params,
}: {
  params: Promise<{ saleQuoteId: string }>;
}) {
  const { saleQuoteId } = await params;
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Sales");
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href={"/sale-quotes"}>{t("backToQuotes")}</BackLink>
      <SaleQuoteDetail orgId={id} saleQuoteId={saleQuoteId} />
    </div>
  );
}
