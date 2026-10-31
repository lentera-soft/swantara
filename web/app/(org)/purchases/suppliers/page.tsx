import { getTranslations } from "next-intl/server";
import { SupplierCatalogSection } from "@/app/(org)/products/supplier-catalog/_components/supplier-catalog-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { requireActiveOrgId } from "@/lib/server/active-org";
import { SuppliersSpendChart } from "./_components/suppliers-spend-chart";
import { SuppliersStats } from "./_components/suppliers-stats-section";
import { SuppliersTable } from "./_components/suppliers-table-section";

export default async function OrgSuppliersPage() {
  const t = await getTranslations("Purchases");
  const tNav = await getTranslations("Nav");
  const id = String(await requireActiveOrgId());
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader title={t("suppliersTitle")} description={t("suppliersSubtitle")} />

      <Tabs defaultValue="suppliers">
        <TabsList variant="line">
          <TabsTrigger value="suppliers">{tNav("suppliers")}</TabsTrigger>
          <TabsTrigger value="supplierCatalog">{tNav("supplierCatalog")}</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="flex flex-col gap-4 sm:gap-6 pt-4">
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
        </TabsContent>

        <TabsContent value="supplierCatalog" className="pt-4">
          <SupplierCatalogSection orgId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
