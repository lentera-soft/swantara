"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useOrgListQuery, useOrgQuery } from "@/lib/hooks/use-org-query";
import type {
  Account,
  ConsolidationElimination,
  ConsolidationRun,
  TaxPeriod,
} from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatNumber } from "@/lib/utils";

export function ConsolidationRunDetailSection({ orgId, runId }: { orgId: string; runId: string }) {
  const t = useTranslations("Consolidation");
  const tCommon = useTranslations("Common");

  const query = useOrgQuery<{
    consolidationRun: ConsolidationRun;
    eliminations: ConsolidationElimination[];
  }>("consolidationRun", runId, (organizationId) =>
    getSwantaraService().consolidationRuns.get(organizationId, Number(runId)),
  );

  const periodsQuery = useOrgListQuery<{ taxPeriods: TaxPeriod[] }, Record<string, never>>(
    "taxPeriods",
    (organizationId) => getSwantaraService().taxPeriods.list(organizationId),
  );
  const accountsQuery = useOrgListQuery<{ accounts: Account[] }, Record<string, never>>(
    "accounts",
    (organizationId) => getSwantaraService().accounts.list(organizationId),
  );
  const organizationsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => getSwantaraService().organizations.list(),
  });

  const run = query.data?.consolidationRun;
  const eliminations = query.data?.eliminations ?? [];
  const periodMap = new Map(
    (periodsQuery.data?.taxPeriods ?? []).map((period) => [period.id, period.name]),
  );
  const accountMap = new Map(
    (accountsQuery.data?.accounts ?? []).map((account) => [
      account.id,
      `${account.code} · ${account.name}`,
    ]),
  );
  const organizationMap = new Map(
    (organizationsQuery.data?.organizations ?? []).map((organization) => [
      organization.id,
      organization.name,
    ]),
  );

  const runMutation = useMutation({
    mutationFn: () => getSwantaraService().consolidationRuns.run(Number(orgId), Number(runId)),
    onSuccess: () => {
      toast.success(t("runSuccess"));
      void query.refetch();
    },
    onError: () => toast.error(t("runFailed")),
  });

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>;
  }

  if (!run) {
    return <p className="text-sm text-muted-foreground">{t("runNotFound")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">
            {run.periodId != null ? (periodMap.get(run.periodId) ?? `#${run.periodId}`) : "—"}
          </h1>
          <p className="text-sm text-muted-foreground">{t("detailDescription")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={run.state === "done" ? "secondary" : "outline"}>
            {(t as unknown as (key: string) => string)(`state_${run.state}`)}
          </Badge>
          {run.state === "draft" ? (
            <ConfirmDialog
              title={t("runTitle")}
              description={t("runDescription")}
              confirmLabel={t("actionRun")}
              cancelLabel={tCommon("cancel")}
              variant="neutral"
              loading={runMutation.isPending}
              onConfirm={() => runMutation.mutate()}
              trigger={
                <Button size="sm">
                  <Play />
                  <span>{t("actionRun")}</span>
                </Button>
              }
            />
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("colPeriod")}</span>
              <span className="text-sm">
                {run.periodId != null ? (periodMap.get(run.periodId) ?? `#${run.periodId}`) : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("colReportingCurrency")}</span>
              <span className="text-sm">{run.reportingCurrency}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("colState")}</span>
              <span className="text-sm">
                {(t as unknown as (key: string) => string)(`state_${run.state}`)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("eliminationsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {eliminations.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("emptyEliminations")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-muted-foreground">{t("colAccount")}</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">
                      {t("colCounterparty")}
                    </th>
                    <th className="px-3 py-2 text-right text-muted-foreground">{t("colAmount")}</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">
                      {t("colDescription")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {eliminations.map((elimination) => (
                    <tr key={elimination.id} className="border-b border-border/50">
                      <td className="px-3 py-2">
                        {accountMap.get(elimination.accountId) ?? `#${elimination.accountId}`}
                      </td>
                      <td className="px-3 py-2">
                        {elimination.counterpartyOrganizationId != null
                          ? (organizationMap.get(elimination.counterpartyOrganizationId) ??
                            `#${elimination.counterpartyOrganizationId}`)
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatNumber(elimination.amount)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {elimination.description || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
