import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { PaymentTermsSection } from "../_components/payment-terms-section";

export default async function OrgReferencePaymentTermsPage() {
  const t = await getTranslations("Reference");
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("paymentTermsTitle")} description={t("description")} />
      <PaymentTermsSection orgId={id} />
    </div>
  );
}
