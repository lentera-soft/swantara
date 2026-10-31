import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { DropshipSection } from "./_components/dropship-section";

export default async function DropshipPage() {
  const t = await getTranslations("Dropship");
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <DropshipSection orgId={id} />
    </div>
  );
}
