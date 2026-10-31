"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { ContactFormDialog } from "@/app/(org)/contacts/_components/contact-form-dialog";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { StateBadge } from "@/components/state-badge";
import { useOrganizationId } from "@/lib/hooks/use-org-context";
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
  const orgId = useOrganizationId();
  const [dialogOpen, setDialogOpen] = useState(false);
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
    <>
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
          <Button size="sm" onClick={() => setDialogOpen(true)} disabled={orgId == null}>
            <Plus />
            <span>{t("addSupplier")}</span>
          </Button>
        }
      />
      {orgId != null ? (
        <ContactFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          orgId={String(orgId)}
          defaultRole="supplier"
          onSave={() => {
            setDialogOpen(false);
            void query.refetch();
          }}
        />
      ) : null}
    </>
  );
}
