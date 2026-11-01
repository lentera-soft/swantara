"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Ban, CheckCircle2, Leaf, Plus, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { RowActions } from "@/app/(org)/_components/row-actions";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { CrmLead, CrmLeadStatus, CrmStage } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatNumber } from "@/lib/utils";
import { DisqualifyDialog } from "./disqualify-dialog";
import { PromoteDialog } from "./promote-section";

function availableLeadActions(status: CrmLeadStatus): {
  contact: boolean;
  qualify: boolean;
  nurture: boolean;
  disqualify: boolean;
} {
  if (status === "converted" || status === "won" || status === "lost") {
    return { contact: false, qualify: false, nurture: false, disqualify: false };
  }
  return {
    contact: status === "new" || status === "nurtured" || status === "disqualified",
    qualify: status === "contacted" || status === "nurtured" || status === "disqualified",
    nurture: status === "new" || status === "contacted" || status === "qualified",
    disqualify: status !== "disqualified",
  };
}

export function LeadsSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Crm");
  const queryClient = useQueryClient();
  const router = useRouter();

  const [promoteId, setPromoteId] = useState<string | null>(null);
  const [disqualifyId, setDisqualifyId] = useState<string | null>(null);

  const leadsQuery = useOrgListQuery<{ leads: CrmLead[] }, Record<string, never>>(
    "crmLeads",
    (organizationId) => getSwantaraService().crmLeads.list(organizationId),
  );
  const stagesQuery = useOrgListQuery<{ stages: CrmStage[] }, Record<string, never>>(
    "crmStages",
    (organizationId) => getSwantaraService().crmStages.list(organizationId),
  );

  const leads = leadsQuery.data?.leads ?? [];
  const stages = stagesQuery.data?.stages ?? [];
  const stageMap = new Map(stages.map((s) => [String(s.id), s.name]));

  const isLoading = leadsQuery.isLoading || stagesQuery.isLoading;
  const error = leadsQuery.error ?? stagesQuery.error;

  function refresh() {
    void leadsQuery.refetch();
    void stagesQuery.refetch();
    void queryClient.invalidateQueries({ queryKey: ["crmLeads"] });
    void queryClient.invalidateQueries({ queryKey: ["crmOpportunities"] });
    void queryClient.invalidateQueries({ queryKey: ["crmStages"] });
  }

  const deleteMutation = useMutation({
    mutationFn: (prospectId: number) =>
      getSwantaraService().crmLeads.delete(Number(orgId), prospectId),
    onSuccess: () => {
      toast.success(t("deleted"));
      refresh();
    },
    onError: () => {
      toast.error(t("saveFailed"));
    },
  });

  const transitionMutation = useMutation({
    mutationFn: ({ prospectId, status }: { prospectId: number; status: CrmLeadStatus }) =>
      getSwantaraService().crmLeads.transitionStatus(Number(orgId), prospectId, { status }),
    onSuccess: () => {
      toast.success(t("lifecycleUpdated"));
      refresh();
    },
    onError: () => {
      toast.error(t("saveFailed"));
    },
  });

  const leadColumns: ColumnDef<CrmLead>[] = [
    {
      accessorKey: "name",
      header: t("tableName"),
      cell: ({ row }) => (
        <span className="flex flex-col">
          <Link className="font-medium hover:underline" href={`/crm/leads/${row.original.id}`}>
            {row.original.name}
          </Link>
          {row.original.email ? (
            <span className="text-xs text-muted-foreground">{row.original.email}</span>
          ) : null}
        </span>
      ),
    },
    {
      accessorKey: "contactName",
      header: t("tableContact"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.contactName ?? "—"}
          {row.original.source ? (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px]">
              {row.original.source}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t("fieldStatus"),
      cell: ({ row }) => (
        <Badge variant={row.original.status === "disqualified" ? "outline" : "secondary"}>
          {t(`status.${row.original.status}`)}
        </Badge>
      ),
    },
    {
      accessorKey: "temperature",
      header: t("fieldTemperature"),
      cell: ({ row }) => <span>{t(`temperature.${row.original.temperature}`)}</span>,
    },
    {
      accessorKey: "leadScore",
      header: t("fieldLeadScore"),
      meta: { align: "right" },
      cell: ({ row }) => <span className="tabular-nums">{row.original.leadScore}</span>,
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
      accessorKey: "stageId",
      header: t("tableStage"),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.stageId
            ? (stageMap.get(String(row.original.stageId)) ?? String(row.original.stageId))
            : "—"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const actions = availableLeadActions(row.original.status);
        return (
          <div className="flex items-center justify-end gap-1">
            {actions.contact ? (
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t("actionContact")}
                title={t("actionContact")}
                onClick={() =>
                  transitionMutation.mutate({ prospectId: row.original.id, status: "contacted" })
                }
                disabled={transitionMutation.isPending}
              >
                <CheckCircle2 className="size-4" />
              </Button>
            ) : null}
            {actions.qualify ? (
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t("actionQualify")}
                title={t("actionQualify")}
                onClick={() =>
                  transitionMutation.mutate({ prospectId: row.original.id, status: "qualified" })
                }
                disabled={transitionMutation.isPending}
              >
                <Target className="size-4" />
              </Button>
            ) : null}
            {actions.nurture ? (
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t("actionNurture")}
                title={t("actionNurture")}
                onClick={() =>
                  transitionMutation.mutate({ prospectId: row.original.id, status: "nurtured" })
                }
                disabled={transitionMutation.isPending}
              >
                <Leaf className="size-4" />
              </Button>
            ) : null}
            {actions.disqualify ? (
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t("actionDisqualify")}
                title={t("actionDisqualify")}
                onClick={() => setDisqualifyId(String(row.original.id))}
                disabled={transitionMutation.isPending}
              >
                <Ban className="size-4" />
              </Button>
            ) : null}
            {row.original.type === "prospect" && row.original.closedAt == null ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPromoteId(String(row.original.id))}
              >
                {t("promoteToOpportunity")}
              </Button>
            ) : null}
            <RowActions
              editLabel={t("editLead")}
              deleteLabel={t("deleteLead")}
              confirmTitle={t("deleteLeadTitle")}
              confirmDescription={t("deleteLeadDescription")}
              onEdit={() => {
                router.push(`/crm/leads/${row.original.id}/edit`);
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
        columns={leadColumns}
        data={leads}
        getRowId={(row) => String(row.id)}
        searchKeys={["name", "contactName", "email"]}
        statusOptions={[
          { value: "new", label: t("status.new") },
          { value: "contacted", label: t("status.contacted") },
          { value: "qualified", label: t("status.qualified") },
          { value: "nurtured", label: t("status.nurtured") },
          { value: "disqualified", label: t("status.disqualified") },
        ]}
        searchPlaceholder={t("searchLeadsPlaceholder")}
        filterLabel={t("searchLeadsPlaceholder")}
        allLabel={t("allLeads")}
        ariaLabel={t("allLeads")}
        emptyTitle={t("emptyLeads")}
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
            <Link href="/crm/leads/new">
              <Plus />
              <span>{t("addLead")}</span>
            </Link>
          </Button>
        }
      />
      {promoteId ? (
        <PromoteDialog
          open={Boolean(promoteId)}
          onOpenChange={(open) => {
            if (!open) setPromoteId(null);
          }}
          orgId={orgId}
          prospectId={promoteId}
          initial={leads.find((lead) => String(lead.id) === promoteId) ?? null}
          onPromoted={() => {
            setPromoteId(null);
            refresh();
          }}
        />
      ) : null}
      {disqualifyId ? (
        <DisqualifyDialog
          open={Boolean(disqualifyId)}
          onOpenChange={(open) => {
            if (!open) setDisqualifyId(null);
          }}
          orgId={orgId}
          leadId={disqualifyId}
          onDone={() => {
            setDisqualifyId(null);
            refresh();
          }}
        />
      ) : null}
    </>
  );
}
