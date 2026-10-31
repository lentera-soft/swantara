import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { DashboardActions } from "./_components/dashboard-actions";
import { DashboardTabs } from "./_components/dashboard-tabs";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OrgDashboardPage() {
  const id = String(await requireActiveOrgId());
  const t = await getTranslations("Dashboard");

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title={t("title")}
        description={t("pageDescription")}
        actions={<DashboardActions />}
      />
      <DashboardTabs orgId={id} />
    </div>
  );
}
