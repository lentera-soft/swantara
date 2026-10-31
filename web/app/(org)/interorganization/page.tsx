import { getTranslations } from "next-intl/server";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { InterorganizationRulesSection } from "./_components/rules-section";

export default async function InterorganizationRulesPage() {
  const t = await getTranslations("Interorganization");
  const id = String(await requireActiveOrgId());
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold">{t("rulesTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("rulesDescription")}</p>
      </div>
      <InterorganizationRulesSection orgId={id} />
    </section>
  );
}
