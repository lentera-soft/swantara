"use client";

import { useMutation } from "@tanstack/react-query";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Eye, Play, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { ConsolidationRun, TaxPeriod } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { ConsolidationRunDialog } from "./consolidation-run-dialog";

export function ConsolidationSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Consolidation");
  const [dialogOpen, setDialogOpen] = useState(false);

  const query = useOrgListQuery<{ consolidationRuns: ConsolidationRun[] }, Record<string, never>>(
    "consolidationRuns",
    (organizationId) => getSwantaraService().consolidationRuns.list(organizationId),
  );

  const periodsQuery = useOrgListQuery<{ taxPeriods: TaxPeriod[] }, Record<string, never>>(
    "taxPeriods",
    (organizationId) => getSwantaraService().taxPeriods.list(organizationId),
  );

  const runs = query.data?.consolidationRuns ?? [];
  const periodMap = new Map((periodsQuery.data?.taxPeriods ?? []).map((p) => [p.id, p.name]));

  const runMutation = useMutation({
    mutationFn: (runId: number) => getSwantaraService().consolidationRuns.run(Number(orgId), runId),
    onSuccess: () => {
      toast.success(t("runSuccess"));
      void query.refetch();
    },
    onError: () => toast.error(t("runFailed")),
  });

  const columns: ColumnDef<ConsolidationRun>[] = [
    {
      accessorKey: "periodId",
      header: t("colPeriod"),
      cell: ({ row }) =>
        row.original.periodId != null
          ? (periodMap.get(row.original.periodId) ?? `#${row.original.periodId}`)
          : "—",
    },
    {
      accessorKey: "reportingCurrency",
      header: t("colReportingCurrency"),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.reportingCurrency}</span>
      ),
    },
    {
      accessorKey: "state",
      header: t("colState"),
      cell: ({ row }) => (
        <Badge variant={row.original.state === "done" ? "secondary" : "outline"}>
          {(t as unknown as (key: string) => string)(`state_${row.original.state}`)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {row.original.state === "draft" ? (
            <ConfirmDialog
              title={t("runTitle")}
              description={t("runDescription")}
              confirmLabel={t("actionRun")}
              variant="neutral"
              loading={runMutation.isPending}
              onConfirm={() => runMutation.mutate(row.original.id)}
              trigger={
                <Button size="icon-sm" variant="ghost" aria-label={t("actionRun")}>
                  <Play />
                </Button>
              }
            />
          ) : null}
          <Button asChild size="icon-sm" variant="ghost">
            <Link href={`/consolidation/${row.original.id}`} aria-label={t("actionView")}>
              <Eye />
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <InteractiveEntityTable
        columns={columns}
        data={runs}
        getRowId={(row) => String(row.id)}
        searchKeys={["reportingCurrency"]}
        searchPlaceholder={t("searchRuns")}
        ariaLabel={t("title")}
        emptyTitle={t("emptyRuns")}
        exportFileName="consolidation-runs"
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
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus />
            <span>{t("newRun")}</span>
          </Button>
        }
      />

      {dialogOpen ? (
        <ConsolidationRunDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          orgId={orgId}
          onSave={() => {
            setDialogOpen(false);
            void query.refetch();
          }}
        />
      ) : null}
    </>
  );
}
