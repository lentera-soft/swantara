"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { StateBadge } from "@/components/state-badge";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Contact } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { humanizeKey } from "@/lib/utils/case";

export type SupplierRow = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  category: string;
  status: "active" | "inactive";
  since: string;
};

function toSupplierRow(contact: Contact): SupplierRow {
  return {
    id: String(contact.id),
    name: contact.displayName ?? contact.name,
    contact: contact.email ?? "",
    phone: contact.phone ?? "",
    category: contact.industry ?? "general",
    status: contact.active ? "active" : "inactive",
    since: contact.createdAt ? new Date(contact.createdAt).toISOString().split("T")[0]! : "",
  };
}

export function SuppliersTable() {
  const t = useTranslations("Purchases");
  const query = useOrgListQuery<{ contacts: Contact[] }, { size: number }>(
    "suppliers",
    (organizationId, params) => getSwantaraService().contacts.list(organizationId, params),
    { size: 100 },
  );

  const suppliers = (query.data?.contacts ?? [])
    .filter((contact) => contact.isSupplier)
    .map(toSupplierRow);

  function statusLabel(status: SupplierRow["status"]): string {
    try {
      return (t as unknown as (k: string) => string)(`supplierStatus.${status}`);
    } catch {
      return humanizeKey(String(status));
    }
  }

  const columns: ColumnDef<SupplierRow>[] = [
    {
      accessorKey: "name",
      header: t("tableName"),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.contact}</span>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: t("tableCategory"),
      cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge>,
    },
    {
      accessorKey: "phone",
      header: t("tablePhone"),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.phone || "—"}</span>,
    },
    {
      accessorKey: "status",
      header: t("tableStatus"),
      cell: ({ row }) => {
        const toneMap: Record<SupplierRow["status"], "success" | "neutral"> = {
          active: "success",
          inactive: "neutral",
        };
        return (
          <StateBadge
            tone={toneMap[row.original.status]}
            label={statusLabel(row.original.status)}
          />
        );
      },
    },
    {
      accessorKey: "since",
      header: t("tableSince"),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.since}</span>,
    },
  ];

  return (
    <InteractiveEntityTable
      columns={columns}
      data={suppliers}
      getRowId={(row) => row.id}
      searchKeys={["name", "contact", "category", "phone"]}
      statusKey="status"
      statusOptions={[
        { value: "active", label: t("supplierStatusActive") },
        { value: "inactive", label: t("supplierStatusInactive") },
      ]}
      searchPlaceholder={t("searchSuppliersPlaceholder")}
      filterLabel={t("filterByStatus")}
      allLabel={t("allStatuses")}
      ariaLabel={t("allSuppliers")}
      status={
        query.isLoading
          ? { type: "loading" }
          : query.isError
            ? {
                type: "error",
                message: query.error.message,
                onRetry: () => void query.refetch(),
              }
            : undefined
      }
      actions={
        <Button size="sm" asChild>
          <Link href="/purchases/suppliers/new">
            <Plus />
            <span>{t("addSupplier")}</span>
          </Link>
        </Button>
      }
    />
  );
}
