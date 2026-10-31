import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { PageHeader } from "@/components/page-header";

import { SuppliersSpendChart } from "./_components/suppliers-spend-chart";
import { SuppliersStats } from "./_components/suppliers-stats-section";
import { SuppliersTable } from "./_components/suppliers-table-section";

export default async function OrgSuppliersPage() {
  const t = await getTranslations("Purchases");
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("suppliersTitle")} description={t("suppliersSubtitle")} />

      <SuppliersStats />

      <SuppliersSpendChart />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{t("allSuppliers")}</CardTitle>
          <CardDescription>{t("suppliersDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SuppliersTable />
        </CardContent>
      </Card>
    </div>
  );
}
