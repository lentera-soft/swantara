import { requireActiveOrgId } from "@/lib/server/active-org";
import { PaymentTermsSection } from "../_components/payment-terms-section";

export default async function OrgReferencePaymentTermsPage() {
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PaymentTermsSection orgId={id} />
    </div>
  );
}
