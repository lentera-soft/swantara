"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import type { PipelineForecast } from "@/lib/services/swantara";
import { formatNumber } from "@/lib/utils";

function ownerLabel(owner: {
  ownerUserId: number | null;
  ownerName: string;
  salespersonId: number | null;
  salesGroupId: number | null;
}): string {
  if (owner.ownerName) return owner.ownerName;
  const parts: string[] = [];
  if (owner.ownerUserId != null) parts.push(`#${owner.ownerUserId}`);
  if (owner.salespersonId != null) parts.push(`#${owner.salespersonId}`);
  if (owner.salesGroupId != null) parts.push(`#${owner.salesGroupId}`);
  return parts.join(" · ");
}

function ownerKey(owner: {
  ownerUserId: number | null;
  salespersonId: number | null;
  salesGroupId: number | null;
}): string {
  if (owner.ownerUserId != null) return `user:${owner.ownerUserId}`;
  if (owner.salespersonId != null) return `salesperson:${owner.salespersonId}`;
  if (owner.salesGroupId != null) return `team:${owner.salesGroupId}`;
  return "unassigned";
}

export function CrmAnalytics({ pipeline }: { pipeline: PipelineForecast | null | undefined }) {
  const t = useTranslations("Crm");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !pipeline) {
    return <p className="text-sm text-muted-foreground">{t("noAnalyticsData")}</p>;
  }

  const funnel = pipeline.leadFunnel;
  const sources = pipeline.sources ?? [];
  const owners = pipeline.owners ?? [];
  const lostReasons = pipeline.lostReasons ?? [];
  const stages = pipeline.stages ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("analyticsTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("analyticsSubtitle")}</p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-border p-3">
              <dt className="text-xs text-muted-foreground">{t("leadToOpportunityCycle")}</dt>
              <dd className="text-lg tabular-nums">
                {t("metricCycleDays", { days: formatNumber(funnel.averageLeadToOpportunityDays) })}
              </dd>
            </div>
            <div className="rounded-md border border-border p-3">
              <dt className="text-xs text-muted-foreground">{t("qualificationRate")}</dt>
              <dd className="text-lg tabular-nums">
                {t("metricPercentage", { value: formatNumber(funnel.qualificationRate) })}
              </dd>
              <p className="text-xs text-muted-foreground">
                {t("metricLeads")}: {funnel.leadTotal} · {t("metricOpportunities")}:{" "}
                {funnel.opportunityTotal}
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <dt className="text-xs text-muted-foreground">{t("responseSlaTitle")}</dt>
              <dd className="text-lg tabular-nums">
                {formatNumber(funnel.averageResponseHours)}h /{" "}
                {formatNumber(funnel.responseSlaHours)}h
              </dd>
              <p className="text-xs text-muted-foreground">
                {t("slaBreached")}: {funnel.responseSlaBreached} · {t("slaAtRisk")}:{" "}
                {funnel.responseSlaAtRisk}
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <dt className="text-xs text-muted-foreground">{t("metricAverageSalesCycle")}</dt>
              <dd className="text-lg tabular-nums">
                {t("metricCycleDays", { days: formatNumber(pipeline.averageSalesCycleDays) })}
              </dd>
              <p className="text-xs text-muted-foreground">
                {t("kpiAvgDeal")}: {formatNumber(pipeline.averageDealSize)}
              </p>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("sourcePerformance")}</CardTitle>
          </CardHeader>
          <CardContent>
            {sources.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noAnalyticsData")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="py-2 font-medium">{t("fieldSource")}</th>
                      <th className="py-2 text-right font-medium">{t("leadCount")}</th>
                      <th className="py-2 text-right font-medium">{t("qualificationRate")}</th>
                      <th className="py-2 text-right font-medium">{t("winRateLabel")}</th>
                      <th className="py-2 text-right font-medium">{t("wonRevenue")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.map((source) => (
                      <tr key={source.source} className="border-t border-border">
                        <td className="py-2">{source.source || t("sourceUnknown")}</td>
                        <td className="py-2 text-right tabular-nums">
                          {source.leadCount} / {source.qualifiedCount}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatNumber(source.qualificationRate)}%
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatNumber(source.opportunityWinRate)}%
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatNumber(source.wonRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("ownerPerformance")}</CardTitle>
          </CardHeader>
          <CardContent>
            {owners.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noAnalyticsData")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="py-2 font-medium">{t("fieldOwner")}</th>
                      <th className="py-2 text-right font-medium">{t("opportunityCount")}</th>
                      <th className="py-2 text-right font-medium">{t("winRateLabel")}</th>
                      <th className="py-2 text-right font-medium">{t("wonRevenue")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {owners.map((owner) => {
                      const label = ownerLabel(owner);
                      return (
                        <tr key={ownerKey(owner)} className="border-t border-border">
                          <td className="py-2">{label || t("unassignedOwner")}</td>
                          <td className="py-2 text-right tabular-nums">{owner.opportunityCount}</td>
                          <td className="py-2 text-right tabular-nums">
                            {formatNumber(owner.winRate)}%
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {formatNumber(owner.wonRevenue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("lostReasonsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {lostReasons.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noAnalyticsData")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {lostReasons.map((reason) => (
                  <li
                    key={reason.code || reason.reason}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span>{reason.code || reason.reason}</span>
                    <span className="tabular-nums text-muted-foreground">{reason.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("stageVelocityTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {stages.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noAnalyticsData")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {stages.map((stage) => (
                  <li
                    key={stage.stageId}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span>{stage.stageName}</span>
                    <span className="text-xs text-muted-foreground">
                      {t("metricOpportunities")}: {stage.opportunityCount} ·{" "}
                      {t("metricAverageStageAge")}:{" "}
                      {t("metricCycleDays", { days: formatNumber(stage.averageAgeDays) })} ·{" "}
                      {t("metricVelocity")}:{" "}
                      {t("metricCycleDays", { days: formatNumber(stage.averageVelocityDays) })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
