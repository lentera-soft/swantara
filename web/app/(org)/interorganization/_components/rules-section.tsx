"use client";

import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { RowActions } from "@/app/(org)/_components/row-actions";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Contact, InterorganizationRule } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { InterorganizationRuleFormDialog } from "./rule-form-dialog";

export function InterorganizationRulesSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Interorganization");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InterorganizationRule | null>(null);

  const query = useOrgListQuery<
    { interorganizationRules: InterorganizationRule[] },
    Record<string, never>
  >("interorganizationRules", (organizationId) =>
    getSwantaraService().interorganizationRules.list(organizationId),
  );

  const organizationsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => getSwantaraService().organizations.list(),
  });

  const rules = query.data?.interorganizationRules ?? [];

  const targetOrganizationIds = useMemo(
    () =>
      Array.from(
        new Set(
          rules
            .map((rule) => rule.toOrganizationId)
            .filter((value): value is number => value != null),
        ),
      ),
    [rules],
  );

  const contactsQueries = useQueries({
    queries: targetOrganizationIds.map((targetOrganizationId) => ({
      queryKey: ["contacts", targetOrganizationId],
      queryFn: () => getSwantaraService().contacts.list(targetOrganizationId),
      staleTime: 60_000,
    })),
  });

  const organizationMap = useMemo(
    () => new Map((organizationsQuery.data?.organizations ?? []).map((org) => [org.id, org.name])),
    [organizationsQuery.data],
  );

  const contactMap = useMemo(() => {
    const map = new Map<number, Map<number, string>>();
    targetOrganizationIds.forEach((targetOrganizationId, index) => {
      const contacts: Contact[] = contactsQueries[index]?.data?.contacts ?? [];
      map.set(
        targetOrganizationId,
        new Map(contacts.map((contact) => [contact.id, contact.displayName || contact.name])),
      );
    });
    return map;
  }, [contactsQueries, targetOrganizationIds]);

  function contactLabel(targetOrganizationId: number | null, contactId: number | null): string {
    if (targetOrganizationId == null || contactId == null) return "—";
    return contactMap.get(targetOrganizationId)?.get(contactId) ?? `#${contactId}`;
  }

  const deleteMutation = useMutation({
    mutationFn: (ruleId: number) =>
      getSwantaraService().interorganizationRules.delete(Number(orgId), ruleId),
    onSuccess: () => {
      toast.success(t("ruleDeleted"));
      void query.refetch();
    },
    onError: () => {
      toast.error(t("deleteFailed"));
    },
  });

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(rule: InterorganizationRule) {
    setEditing(rule);
    setOpen(true);
  }

  const columns: ColumnDef<InterorganizationRule>[] = [
    {
      accessorKey: "toOrganizationId",
      header: t("colToOrganization"),
      cell: ({ row }) =>
        row.original.toOrganizationId != null
          ? (organizationMap.get(row.original.toOrganizationId) ??
            `#${row.original.toOrganizationId}`)
          : "—",
    },
    {
      accessorKey: "autoMirror",
      header: t("colAutoMirror"),
      cell: ({ row }) => (
        <Badge variant={row.original.autoMirror ? "secondary" : "outline"}>
          {row.original.autoMirror ? t("autoMirrorOn") : t("autoMirrorOff")}
        </Badge>
      ),
    },
    {
      accessorKey: "supplierContactId",
      header: t("colSupplierContact"),
      cell: ({ row }) =>
        contactLabel(row.original.toOrganizationId, row.original.supplierContactId),
    },
    {
      accessorKey: "customerContactId",
      header: t("colCustomerContact"),
      cell: ({ row }) =>
        contactLabel(row.original.toOrganizationId, row.original.customerContactId),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          editLabel={tCommon("edit")}
          deleteLabel={tCommon("delete")}
          confirmTitle={t("deleteRuleTitle")}
          confirmDescription={t("deleteRuleDescription")}
          onEdit={() => openEdit(row.original)}
          onDelete={() => deleteMutation.mutate(row.original.id)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <InteractiveEntityTable
        columns={columns}
        data={rules}
        getRowId={(row) => String(row.id)}
        searchKeys={["toOrganizationId"]}
        searchPlaceholder={t("searchRules")}
        ariaLabel={t("rulesTitle")}
        emptyTitle={t("emptyRules")}
        exportFileName="interorganization-rules"
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
          <Button size="sm" onClick={openCreate}>
            <Plus />
            <span>{t("newRule")}</span>
          </Button>
        }
      />

      {open ? (
        <InterorganizationRuleFormDialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setEditing(null);
          }}
          initial={editing}
          onSave={() => {
            setOpen(false);
            setEditing(null);
            void query.refetch();
          }}
        />
      ) : null}
    </div>
  );
}
