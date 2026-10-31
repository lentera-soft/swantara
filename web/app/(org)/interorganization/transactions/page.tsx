import { getTranslations } from "next-intl/server";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { InterorganizationTransactionsSection } from "../_components/transactions-section";

export default async function InterorganizationTransactionsPage() {
  const t = await getTranslations("Interorganization");
  const id = String(await requireActiveOrgId());
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold">{t("transactionsTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("transactionsDescription")}</p>
      </div>
      <InterorganizationTransactionsSection orgId={id} />
    </section>
  );
}
