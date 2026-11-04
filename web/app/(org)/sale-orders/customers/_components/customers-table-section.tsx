"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { Button } from "@/components/button";
import { StateBadge } from "@/components/state-badge";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Contact } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { humanizeKey } from "@/lib/utils/case";

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  status: "active" | "dormant";
  since: string;
};

function toCustomerRow(contact: Contact): CustomerRow {
  return {
    id: String(contact.id),
    name: contact.displayName ?? contact.name,
    email: contact.email ?? "",
    status: contact.active ? "active" : "dormant",
    since: contact.createdAt ? new Date(contact.createdAt).toISOString().split("T")[0]! : "",
  };
}

export function CustomersTable() {
  const t = useTranslations("Sales");

  const query = useOrgListQuery<{ contacts: Contact[] }, { size: number }>(
    "contacts",
    (organizationId, params) => getSwantaraService().contacts.list(organizationId, params),
    { size: 100 },
  );

  const customers = (query.data?.contacts ?? [])
    .filter((contact) => contact.isCustomer)
    .map(toCustomerRow);

  function statusLabel(status: CustomerRow["status"]): string {
    try {
      return (t as unknown as (k: string) => string)(`customerStatus.${status}`);
    } catch {
      return humanizeKey(String(status));
    }
  }

  const columns: ColumnDef<CustomerRow>[] = [
    {
      accessorKey: "name",
      header: t("tableName"),
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{row.original.name}</span>
          {row.original.email ? (
            <span className="truncate text-xs text-muted-foreground">{row.original.email}</span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: t("tableStatus"),
      cell: ({ row }) => {
        const toneMap: Record<CustomerRow["status"], "success" | "neutral"> = {
          active: "success",
          dormant: "neutral",
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
      header: t("tableCustomerSince"),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.since}</span>,
    },
  ];

  return (
    <InteractiveEntityTable
      columns={columns}
      data={customers}
      getRowId={(row) => row.id}
      searchKeys={["name", "email"]}
      statusKey="status"
      statusOptions={[
        { value: "active", label: t("statusActive") },
        { value: "dormant", label: t("statusDormant") },
      ]}
      searchPlaceholder={t("searchCustomersPlaceholder")}
      filterLabel={t("filterByStatus")}
      allLabel={t("allStatuses")}
      ariaLabel={t("allCustomers")}
      emptyTitle={t("emptyCustomers")}
      emptyDescription={t("emptyCustomersDescription")}
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
        <Button asChild>
          <Link href="/sale-orders/customers/new">
            <Plus aria-hidden />
            <span>{t("addCustomer")}</span>
          </Link>
        </Button>
      }
    />
  );
}
