import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/back-link";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { PaymentTermFormEdit } from "../../_components/payment-term-form";

export default async function OrgReferenceEditPaymentTermPage({
  params,
}: {
  params: Promise<{ termId: string }>;
}) {
  const t = await getTranslations("Reference");
  const { termId } = await params;
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BackLink href="/reference/payment-terms">{t("backToPaymentTerms")}</BackLink>
      <PaymentTermFormEdit orgId={id} termId={termId} />
    </div>
  );
}
