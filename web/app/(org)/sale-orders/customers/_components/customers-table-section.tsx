"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { FileTextIcon, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { RowActions } from "@/app/(org)/_components/row-actions";
import { Button } from "@/components/button";
import { StateBadge } from "@/components/state-badge";
import { useOrganizationId } from "@/lib/hooks/use-org-context";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Contact } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { humanizeKey } from "@/lib/utils/case";

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  taxId: string;
  status: "active" | "dormant";
  since: string;
  contact: Contact;
};

function toCustomerRow(contact: Contact): CustomerRow {
  return {
    id: String(contact.id),
    name: contact.displayName ?? contact.name,
    email: contact.email ?? "",
    phone: contact.phone ?? contact.mobile ?? "",
    website: contact.website ?? "",
    industry: contact.industry ?? "",
    taxId: contact.taxId ?? "",
    status: contact.active ? "active" : "dormant",
    since: contact.createdAt ? new Date(contact.createdAt).toISOString().split("T")[0]! : "",
    contact,
  };
}

export function CustomersTable() {
  const t = useTranslations("Sales");
  const router = useRouter();
  const organizationId = useOrganizationId();

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
          <Link
            href={`/sale-orders/customers/${row.original.id}`}
            className="truncate font-medium hover:underline"
          >
            {row.original.name}
          </Link>
          {row.original.email ? (
            <span className="truncate text-xs text-muted-foreground">{row.original.email}</span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: t("tablePhone"),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.phone || "—"}</span>,
    },
    {
      accessorKey: "website",
      header: t("tableWebsite"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.website || "—"}</span>
      ),
    },
    {
      accessorKey: "industry",
      header: t("tableIndustry"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.industry || "—"}</span>
      ),
    },
    {
      accessorKey: "taxId",
      header: t("tableTaxId"),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.taxId || "—"}</span>,
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
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          editLabel={t("editCustomer")}
          deleteLabel={t("deleteCustomer")}
          confirmTitle={t("deleteCustomerTitle")}
          confirmDescription={t("deleteCustomerDescription")}
          onEdit={() => router.push(`/sale-orders/customers/${row.original.id}/edit`)}
          onDelete={() => {
            if (organizationId == null) return;
            void getSwantaraService()
              .contacts.delete(organizationId, Number(row.original.id))
              .then(() => void query.refetch())
              .catch(() => toast.error(t("deleteFailed")));
          }}
          items={[
            {
              label: t("newQuote"),
              icon: <FileTextIcon aria-hidden />,
              onSelect: () => router.push(`/sale-quotes?contact=${row.original.id}`),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <InteractiveEntityTable
        columns={columns}
        data={customers}
        getRowId={(row) => row.id}
        searchKeys={["name", "email", "phone", "website", "industry", "taxId"]}
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
    </div>
  );
}
