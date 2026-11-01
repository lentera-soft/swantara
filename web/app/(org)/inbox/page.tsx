import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { InboxSection } from "./_components/inbox-section";

export default async function InboxPage() {
  const t = await getTranslations("Inbox");
  const id = String(await requireActiveOrgId());

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader force title={t("title")} description={t("pageDescription")} />
      <InboxSection orgId={id} />
    </div>
  );
}
