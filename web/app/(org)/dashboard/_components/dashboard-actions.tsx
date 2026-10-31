"use client";

import {
  Briefcase,
  Factory,
  FileDown,
  FileText,
  Package,
  Plus,
  ShoppingCart,
  Truck,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dropdown";
import { toast } from "@/components/toast";
import { useFinanceKpi } from "@/lib/hooks/use-dashboard-kpis";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Contact, Employee } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { exportCsv } from "@/lib/utils/csv";

export function DashboardActions() {
  const t = useTranslations("Dashboard");
  const financeKpi = useFinanceKpi();
  const contactsQuery = useOrgListQuery<{ contacts: Contact[] }, Record<string, never>, number>(
    "contacts",
    (organizationId) => getSwantaraService().contacts.list(organizationId),
    {},
    { select: (data) => data.contacts.length },
  );
  const employeesQuery = useOrgListQuery<{ employees: Employee[] }, Record<string, never>, number>(
    "employees",
    (organizationId) => getSwantaraService().employees.list(organizationId),
    {},
    { select: (data) => data.employees.length },
  );

  function handleExport() {
    const finance = financeKpi.data;
    const rows: Array<[string, number]> = [
      [t("stat_revenue"), finance?.revenue ?? 0],
      [t("stat_expenses"), finance?.expenses ?? 0],
      [t("stat_ebitda"), finance?.ebitda ?? 0],
      [t("stat_customers"), contactsQuery.data ?? 0],
      [t("stat_employees"), employeesQuery.data ?? 0],
    ];
    const stamp = new Date().toISOString().split("T")[0];
    exportCsv(`dashboard-${stamp}`, [t("exportColumnMetric"), t("exportColumnValue")], rows);
    toast.success(t("reportExported"));
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleExport} aria-label={t("exportReport")}>
        <FileDown aria-hidden />
        <span className="hidden sm:inline">{t("exportReport")}</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" aria-label={t("quickCreate")}>
            <Plus aria-hidden />
            <span className="hidden sm:inline">{t("quickCreate")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={"/contacts"} />}>
            <Users aria-hidden />
            {t("newCustomer")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={"/purchases/suppliers"} />}>
            <Truck aria-hidden />
            {t("newSupplier")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={"/products"} />}>
            <Package aria-hidden />
            {t("newProduct")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={"/sale-orders"} />}>
            <ShoppingCart aria-hidden />
            {t("newSalesOrder")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={"/purchases"} />}>
            <Truck aria-hidden />
            {t("newPurchaseOrder")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={"/accounting"} />}>
            <FileText aria-hidden />
            {t("newInvoice")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={"/employees"} />}>
            <UserRound aria-hidden />
            {t("newEmployee")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={"/production-orders"} />}>
            <Factory aria-hidden />
            {t("newProductionOrder")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={"/projects"} />}>
            <Briefcase aria-hidden />
            {t("newProject")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
