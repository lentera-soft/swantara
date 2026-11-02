"use client";

import { useIsRestoring } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import type { CrmLead, PipelineForecast } from "@/lib/services/swantara";
import { formatNumber } from "@/lib/utils";
import { weightedPipeline, winRate } from "./crm-utils";

export function CrmKpis({
  pipeline,
  opportunities,
  leads,
  stagesCount,
}: {
  pipeline: PipelineForecast | null | undefined;
  opportunities: CrmLead[];
  leads: CrmLead[];
  stagesCount: number;
}) {
  const t = useTranslations("Crm");
  const isRestoring = useIsRestoring();
  const liveWeighted = weightedPipeline(
    opportunities.filter((o) => o.closedAt == null && o.lostReason == null),
  );
  const liveTotal = opportunities
    .filter((o) => o.closedAt == null && o.lostReason == null)
    .reduce((sum, o) => sum + o.expectedRevenue, 0);
  const won = opportunities.filter((o) => o.isWon).length;
  const lost = opportunities.filter((o) => o.lostReason != null).length;
  const liveWinRate = winRate(won, lost);

  const weighted = pipeline?.weightedPipeline ?? liveWeighted;
  const total = pipeline?.totalExpectedRevenue ?? liveTotal;
  const rate = pipeline?.winRate ?? liveWinRate;
  const closedDeals = won + lost;
  const winShare = closedDeals > 0 ? Math.min(100, Math.max(0, (won / closedDeals) * 100)) : 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">{t("kpiWeighted")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl tabular-nums">{isRestoring ? "—" : formatNumber(weighted)}</p>
          <p className="text-xs text-muted-foreground">{t("kpiWeightedHint")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">{t("kpiExpectedRevenue")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl tabular-nums">{isRestoring ? "—" : formatNumber(total)}</p>
          <p className="text-xs text-muted-foreground">
            {t("kpiOpenDeals")}:{" "}
            {isRestoring
              ? "—"
              : opportunities.filter((o) => o.closedAt == null && o.lostReason == null).length}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">{t("kpiWinRate")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div
              role="img"
              aria-label={
                isRestoring
                  ? t("kpiWinRate")
                  : `${t("kpiWinRate")}: ${formatNumber(rate)}%. ${t("kpiWon")}: ${won}. ${t("kpiLost")}: ${lost}.`
              }
              className="relative size-16 shrink-0 rounded-full"
              style={{
                background:
                  closedDeals > 0
                    ? `conic-gradient(var(--chart-1) 0% ${winShare}%, var(--chart-2) ${winShare}% 100%)`
                    : "var(--muted)",
              }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-1.5 grid place-items-center rounded-full bg-card text-xs font-semibold tabular-nums"
              >
                {isRestoring ? "—" : `${formatNumber(rate)}%`}
              </span>
            </div>
            <div className="min-w-0 text-xs">
              <p className="truncate">
                {t("kpiWon")}: <span className="tabular-nums">{isRestoring ? "—" : won}</span>
              </p>
              <p className="mt-1 truncate text-muted-foreground">
                {t("kpiLost")}: <span className="tabular-nums">{isRestoring ? "—" : lost}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">{t("kpiOpenDeals")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl tabular-nums">
            {isRestoring
              ? "—"
              : opportunities.length + leads.filter((l) => l.type === "prospect").length}
          </p>
          <p className="text-xs text-muted-foreground">
            {stagesCount} {t("kpiWinRateHint")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">{t("kpiCommit")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl tabular-nums">
            {isRestoring ? "—" : formatNumber(pipeline?.commitRevenue ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("kpiWeighted")}: {isRestoring ? "—" : formatNumber(pipeline?.weightedCommit ?? 0)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">{t("kpiBestCase")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl tabular-nums">
            {isRestoring ? "—" : formatNumber(pipeline?.bestCaseRevenue ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("kpiWeighted")}: {isRestoring ? "—" : formatNumber(pipeline?.weightedBestCase ?? 0)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">{t("kpiConversionRate")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl tabular-nums">
            {isRestoring ? "—" : `${formatNumber(pipeline?.leadFunnel.conversionRate ?? 0)}%`}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("kpiResponseHours")}:{" "}
            {isRestoring ? "—" : formatNumber(pipeline?.leadFunnel.averageResponseHours ?? 0)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">{t("kpiAvgCycle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl tabular-nums">
            {isRestoring ? "—" : formatNumber(pipeline?.averageSalesCycleDays ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("kpiAvgDeal")}: {isRestoring ? "—" : formatNumber(pipeline?.averageDealSize ?? 0)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function CrmPipelineKpiWall({
  pipeline,
}: {
  pipeline: PipelineForecast | null | undefined;
}) {
  const t = useTranslations("Crm");
  if (!pipeline || pipeline.stages.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noForecast")}</p>;
  }

  const maxRevenue = Math.max(
    1,
    ...pipeline.stages.flatMap((stage) => [stage.expectedRevenue, stage.weightedRevenue]),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-primary/80" />
          {t("kpiExpectedRevenue")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-emerald-500/80" />
          {t("kpiWeighted")}
        </span>
      </div>
      <ul aria-label={t("pipelineTitle")} className="flex flex-col gap-3">
        {pipeline.stages.map((stage) => (
          <li
            key={stage.stageId}
            className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[minmax(9rem,0.8fr)_minmax(0,1.8fr)] sm:items-center sm:gap-5 sm:px-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{stage.stageName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stage.opportunityCount} {t("metricOpportunities")} · {t("kpiStageAge")}:{" "}
                {formatNumber(stage.averageAgeDays)}d
              </p>
              {stage.exitCriteria ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {stage.exitCriteria}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              {[
                {
                  label: t("kpiExpectedRevenue"),
                  value: stage.expectedRevenue,
                  color: "bg-primary/80",
                },
                {
                  label: t("kpiWeighted"),
                  value: stage.weightedRevenue,
                  color: "bg-emerald-500/80",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-2 text-xs"
                >
                  <span className="truncate text-muted-foreground">{label}</span>
                  <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${Math.max(0, (value / maxRevenue) * 100)}%` }}
                    />
                  </div>
                  <span className="min-w-16 text-right tabular-nums">{formatNumber(value)}</span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
