"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Plus, Trophy, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { RowActions } from "@/app/(org)/_components/row-actions";
import { SaleQuoteFormDialog } from "@/app/(org)/sale-quotes/_components/sale-quote-form-dialog";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { CrmLead, CrmStage } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDate, formatNumber } from "@/lib/utils";
import { LostReasonDialog } from "./lost-reason-dialog";

export function OpportunitiesSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Crm");
  const queryClient = useQueryClient();
  const router = useRouter();

  const [loseId, setLoseId] = useState<string | null>(null);
  const [quoteOpportunityId, setQuoteOpportunityId] = useState<string | null>(null);

  const opportunitiesQuery = useOrgListQuery<{ opportunities: CrmLead[] }, Record<string, never>>(
    "crmOpportunities",
    (organizationId) => getSwantaraService().crmOpportunities.list(organizationId),
  );
  const stagesQuery = useOrgListQuery<{ stages: CrmStage[] }, Record<string, never>>(
    "crmStages",
    (organizationId) => getSwantaraService().crmStages.list(organizationId),
  );

  const opportunities = opportunitiesQuery.data?.opportunities ?? [];
  const stages = stagesQuery.data?.stages ?? [];
  const stageMap = new Map(stages.map((s) => [String(s.id), s.name]));

  const isLoading = opportunitiesQuery.isLoading || stagesQuery.isLoading;
  const error = opportunitiesQuery.error ?? stagesQuery.error;

  function refresh() {
    void opportunitiesQuery.refetch();
    void stagesQuery.refetch();
    void queryClient.invalidateQueries({ queryKey: ["crmOpportunities"] });
    void queryClient.invalidateQueries({ queryKey: ["crmPipeline"] });
    void queryClient.invalidateQueries({ queryKey: ["crmStages"] });
  }

  const winMutation = useMutation({
    mutationFn: (prospectId: number) =>
      getSwantaraService().crmOpportunities.win(Number(orgId), prospectId),
    onSuccess: (_data, prospectId) => {
      toast.success(t("markedWon"), {
        action: {
          label: t("createQuote"),
          onClick: () => setQuoteOpportunityId(String(prospectId)),
        },
      });
      refresh();
    },
    onError: () => {
      toast.error(t("saveFailed"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (prospectId: number) =>
      getSwantaraService().crmOpportunities.delete(Number(orgId), prospectId),
    onSuccess: () => {
      toast.success(t("deleted"));
      refresh();
    },
    onError: () => {
      toast.error(t("saveFailed"));
    },
  });

  const oppColumns: ColumnDef<CrmLead>[] = [
    {
      accessorKey: "name",
      header: t("tableName"),
      cell: ({ row }) => (
        <span className="flex flex-col">
          <Link
            className="font-medium hover:underline"
            href={`/crm/opportunities/${row.original.id}`}
          >
            {row.original.name}
          </Link>
          {row.original.contactName ? (
            <span className="text-xs text-muted-foreground">{row.original.contactName}</span>
          ) : null}
        </span>
      ),
    },
    {
      accessorKey: "stageId",
      header: t("tableStage"),
      cell: ({ row }) => {
        const stageName = row.original.stageId ? stageMap.get(String(row.original.stageId)) : null;
        return (
          <Badge
            variant={
              row.original.isWon ? "default" : row.original.lostReason ? "outline" : "secondary"
            }
          >
            {stageName ?? "—"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("fieldStatus"),
      cell: ({ row }) => (
        <Badge
          variant={row.original.isWon ? "default" : row.original.isLost ? "outline" : "secondary"}
        >
          {t(`status.${row.original.status}`)}
        </Badge>
      ),
    },
    {
      accessorKey: "forecastCategory",
      header: t("fieldForecastCategory"),
      cell: ({ row }) => <span>{t(`forecast.${row.original.forecastCategory}`)}</span>,
    },
    {
      accessorKey: "expectedRevenue",
      header: t("tableExpectedRevenue"),
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="tabular-nums">{formatNumber(row.original.expectedRevenue)}</span>
      ),
    },
    {
      accessorKey: "probability",
      header: t("tableProbability"),
      meta: { align: "right" },
      cell: ({ row }) => <span className="tabular-nums">{row.original.probability}%</span>,
    },
    {
      accessorKey: "weighted",
      header: t("tableWeighted"),
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="tabular-nums ">
          {formatNumber(
            Math.round(((row.original.expectedRevenue * row.original.probability) / 100) * 100) /
              100,
          )}
        </span>
      ),
    },
    {
      accessorKey: "nextStep",
      header: t("fieldNextStep"),
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span className="text-sm">{row.original.nextStep ?? "—"}</span>
          {row.original.nextStepDue ? (
            <span className="text-xs text-muted-foreground">
              {formatDate(row.original.nextStepDue)}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      accessorKey: "expectedClose",
      header: t("tableExpectedClose"),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.expectedClose ? formatDate(row.original.expectedClose) : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const isOpen =
          row.original.closedAt == null && row.original.lostReason == null && !row.original.isWon;
        return (
          <div className="flex items-center justify-end gap-1">
            {isOpen ? (
              <>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("markWon")}
                  onClick={() => winMutation.mutate(row.original.id)}
                  disabled={winMutation.isPending}
                >
                  <Trophy className="size-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("markLost")}
                  onClick={() => setLoseId(String(row.original.id))}
                >
                  <XCircle className="size-4" />
                </Button>
              </>
            ) : null}
            {!row.original.isLost && row.original.lostReason == null ? (
              <Button size="sm" variant="outline" asChild>
                <a href={`/sale-quotes?opportunity=${row.original.id}`}>{t("createQuote")}</a>
              </Button>
            ) : null}
            <RowActions
              editLabel={t("editOpportunity")}
              deleteLabel={t("deleteOpportunity")}
              confirmTitle={t("deleteOpportunityTitle")}
              confirmDescription={t("deleteOpportunityDescription")}
              onEdit={() => {
                router.push(`/crm/opportunities/${row.original.id}/edit`);
              }}
              onDelete={() => {
                deleteMutation.mutate(row.original.id);
              }}
            />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <InteractiveEntityTable
        columns={oppColumns}
        data={opportunities}
        getRowId={(row) => String(row.id)}
        searchKeys={["name"]}
        statusOptions={[
          { value: "qualified", label: t("status.qualified") },
          { value: "won", label: t("status.won") },
          { value: "lost", label: t("status.lost") },
        ]}
        searchPlaceholder={t("searchOpportunitiesPlaceholder")}
        filterLabel={t("searchOpportunitiesPlaceholder")}
        allLabel={t("allOpportunities")}
        ariaLabel={t("allOpportunities")}
        emptyTitle={t("emptyOpportunities")}
        status={
          isLoading
            ? { type: "loading" }
            : error
              ? {
                  type: "error",
                  message: error.message,
                  onRetry: refresh,
                }
              : undefined
        }
        actions={
          <Button size="sm" asChild>
            <Link href="/crm/opportunities/new">
              <Plus />
              <span>{t("addOpportunity")}</span>
            </Link>
          </Button>
        }
      />
      {quoteOpportunityId ? (
        <SaleQuoteFormDialog
          open
          onOpenChange={(open) => {
            if (!open) setQuoteOpportunityId(null);
          }}
          orgId={orgId}
          initialOpportunityId={quoteOpportunityId}
          onSave={() => {
            setQuoteOpportunityId(null);
            refresh();
          }}
        />
      ) : null}
      {loseId ? (
        <LostReasonDialog
          open={Boolean(loseId)}
          onOpenChange={(open) => {
            if (!open) setLoseId(null);
          }}
          orgId={orgId}
          opportunityId={loseId}
          onDone={() => {
            setLoseId(null);
            refresh();
          }}
        />
      ) : null}
    </>
  );
}
