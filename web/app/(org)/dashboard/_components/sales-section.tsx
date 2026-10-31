"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { BarChart } from "@/components/bar-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { DonutChart } from "@/components/donut-chart";
import { LineChart } from "@/components/line-chart";
import { DEFAULT_CURRENCY } from "@/lib/constants/currency";
import { useLeadToCashKpi, usePipelineKpi, useSalesKpi } from "@/lib/hooks/use-dashboard-kpis";
import { formatMoney } from "@/lib/utils";
import { KpiCard } from "./kpi-card";

export function SalesSection() {
  const t = useTranslations("Dashboard");
  const salesKpi = useSalesKpi();
  const sales = salesKpi.data;

  const salesData = useMemo(
    () =>
      sales
        ? [
            { label: t("bookings"), value: sales.bookings },
            { label: t("stat_revenue"), value: sales.revenue },
            { label: t("cogs"), value: sales.cogs },
            { label: t("grossMargin"), value: sales.grossMargin },
          ]
        : [
            { label: t("bookings"), value: 0 },
            { label: t("stat_revenue"), value: 0 },
            { label: t("cogs"), value: 0 },
            { label: t("grossMargin"), value: 0 },
          ],
    [sales, t],
  );

  const winRateData = useMemo(
    () =>
      sales
        ? [
            { label: t("winRate"), value: sales.winRate * 100 },
            { label: t("loss"), value: (1 - sales.winRate) * 100 },
          ]
        : [
            { label: t("winRate"), value: 0 },
            { label: t("loss"), value: 0 },
          ],
    [sales, t],
  );

  const marginFlow = useMemo(
    () =>
      sales
        ? [
            { label: t("bookings"), value: sales.bookings },
            { label: t("stat_revenue"), value: sales.revenue },
            { label: t("grossMargin"), value: sales.grossMargin },
          ]
        : [
            { label: t("bookings"), value: 0 },
            { label: t("stat_revenue"), value: 0 },
            { label: t("grossMargin"), value: 0 },
          ],
    [sales, t],
  );

  return (
    <div className="grid gap-4 grid-cols-12">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>{t("salesTitle")}</CardTitle>
          <CardDescription>{t("salesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-12">
          <KpiCard
            className="col-span-6 rounded-xl border border-border bg-card p-4"
            label={t("bookings")}
          >
            {sales ? formatMoney(sales.bookings, { currency: DEFAULT_CURRENCY }) : "—"}
          </KpiCard>
          <KpiCard
            className="col-span-6 rounded-xl border border-border bg-card p-4"
            label={t("stat_revenue")}
          >
            {sales ? formatMoney(sales.revenue, { currency: DEFAULT_CURRENCY }) : "—"}
          </KpiCard>
          <KpiCard
            className="col-span-6 rounded-xl border border-border bg-card p-4"
            label={t("cogs")}
          >
            {sales ? formatMoney(sales.cogs, { currency: DEFAULT_CURRENCY }) : "—"}
          </KpiCard>
          <div className="col-span-6 rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {t("grossMargin")}
            </p>
            <p className="mt-1 font-heading text-xl font-semibold tabular-nums">
              {sales ? formatMoney(sales.grossMargin, { currency: DEFAULT_CURRENCY }) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {sales ? `${(sales.grossMarginPct * 100).toFixed(1)}%` : "—"}
            </p>
          </div>
          <KpiCard
            className="col-span-12 rounded-xl border border-border bg-card p-4 bg-primary/[0.04] border-primary/15"
            label={t("winRate")}
          >
            {sales ? `${(sales.winRate * 100).toFixed(1)}%` : "—"}
          </KpiCard>
        </CardContent>
      </Card>
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle className="text-sm">{t("bookingFlowTitle")}</CardTitle>
          <CardDescription>{t("bookingFlowDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={salesData}
            ariaLabel={t("salesTitle")}
            valueFormatter={(value) => formatMoney(value, { currency: DEFAULT_CURRENCY })}
          />
        </CardContent>
      </Card>
      <Card className="col-span-6">
        <CardHeader>
          <CardTitle className="text-sm">{t("winRate")}</CardTitle>
          <CardDescription>{t("winVsLoss")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DonutChart
            data={winRateData}
            ariaLabel={t("winRate")}
            valueFormatter={(value) => `${value.toFixed(1)}%`}
            centerLabel={t("winRate")}
          />
        </CardContent>
      </Card>
      <Card className="col-span-6">
        <CardHeader>
          <CardTitle className="text-sm">{t("marginTrendTitle")}</CardTitle>
          <CardDescription>{t("marginFlowDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart
            data={marginFlow}
            ariaLabel={t("grossMargin")}
            valueFormatter={(value) => formatMoney(value, { currency: DEFAULT_CURRENCY })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function PipelineSection() {
  const t = useTranslations("Dashboard");
  const pipelineKpi = usePipelineKpi();
  const pipeline = pipelineKpi.data;

  const pipelineData = useMemo(
    () =>
      pipeline
        ? [
            { label: t("weightedPipeline"), value: pipeline.weightedPipeline },
            { label: t("expectedRevenue"), value: pipeline.totalExpectedRevenue },
          ]
        : [
            { label: t("weightedPipeline"), value: 0 },
            { label: t("expectedRevenue"), value: 0 },
          ],
    [pipeline, t],
  );

  const pipelineWinData = useMemo(
    () =>
      pipeline
        ? [
            { label: t("winRate"), value: pipeline.winRate * 100 },
            { label: t("loss"), value: (1 - pipeline.winRate) * 100 },
          ]
        : [
            { label: t("winRate"), value: 0 },
            { label: t("loss"), value: 0 },
          ],
    [pipeline, t],
  );

  return (
    <div className="grid gap-4 grid-cols-12">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>{t("pipelineTitle")}</CardTitle>
          <CardDescription>{t("pipelineDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-12">
          <KpiCard
            className="col-span-6 rounded-xl border border-border bg-card p-4 bg-primary/[0.04] border-primary/15"
            label={t("weightedPipeline")}
          >
            {pipeline
              ? formatMoney(pipeline.weightedPipeline, { currency: DEFAULT_CURRENCY })
              : "—"}
          </KpiCard>
          <KpiCard
            className="col-span-6 rounded-xl border border-border bg-card p-4"
            label={t("expectedRevenue")}
          >
            {pipeline
              ? formatMoney(pipeline.totalExpectedRevenue, { currency: DEFAULT_CURRENCY })
              : "—"}
          </KpiCard>
          <KpiCard
            className="col-span-6 rounded-xl border border-border bg-card p-4"
            label={t("winRate")}
          >
            {pipeline ? `${(pipeline.winRate * 100).toFixed(1)}%` : "—"}
          </KpiCard>
          <KpiCard
            className="col-span-6 rounded-xl border border-border bg-card p-4"
            label={t("stages")}
          >
            {pipeline ? String(pipeline.stages) : "—"}
          </KpiCard>
        </CardContent>
      </Card>
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle className="text-sm">{t("pipelineValueTitle")}</CardTitle>
          <CardDescription>{t("pipelineValueDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={pipelineData}
            ariaLabel={t("pipelineTitle")}
            valueFormatter={(value) => formatMoney(value, { currency: DEFAULT_CURRENCY })}
          />
        </CardContent>
      </Card>
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle className="text-sm">{t("winRate")}</CardTitle>
          <CardDescription>{t("pipelineWinDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DonutChart
            data={pipelineWinData}
            ariaLabel={t("winRate")}
            valueFormatter={(value) => `${value.toFixed(1)}%`}
            centerLabel={t("winRate")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function LeadToCashSection() {
  const t = useTranslations("Dashboard");
  const leadToCashKpi = useLeadToCashKpi();
  const data = leadToCashKpi.data;
  const funnel = data?.funnel;
  const cycles = data?.cycleTimes;

  const cycleRows = useMemo(
    () => [
      { label: t("cycleLeadToOpportunity"), value: cycles?.leadToOpportunityDays ?? 0 },
      { label: t("cycleOpportunityToQuote"), value: cycles?.opportunityToQuoteDays ?? 0 },
      { label: t("cycleQuoteToOrder"), value: cycles?.quoteToOrderDays ?? 0 },
      { label: t("cycleOrderToCash"), value: cycles?.orderToCashDays ?? 0 },
    ],
    [cycles, t],
  );

  const segments = useMemo(
    () => [
      ...(data?.sources ?? []).map((segment) => ({
        ...segment,
        dimensionLabel: t("dimensionSource"),
      })),
      ...(data?.owners ?? []).map((segment) => ({
        ...segment,
        dimensionLabel: t("dimensionOwner"),
      })),
      ...(data?.salesGroups ?? []).map((segment) => ({
        ...segment,
        dimensionLabel: t("dimensionSalesGroup"),
      })),
    ],
    [data, t],
  );

  const funnelStats = [
    { label: t("funnelLeads"), value: funnel?.leads ?? 0, money: false },
    { label: t("funnelQualified"), value: funnel?.qualifiedOpportunities ?? 0, money: false },
    { label: t("funnelQuotes"), value: funnel?.quotes ?? 0, money: false },
    { label: t("orders"), value: funnel?.orders ?? 0, money: false },
    { label: t("funnelInvoices"), value: funnel?.invoices ?? 0, money: false },
    { label: t("collectedCash"), value: funnel?.collectedCash ?? 0, money: true },
  ];

  return (
    <Card className="col-span-12">
      <CardHeader>
        <CardTitle className="text-sm">{t("leadToCashTitle")}</CardTitle>
        <CardDescription>{t("leadToCashDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {t("leadToCashFunnel")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {funnelStats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 font-heading text-xl font-semibold tabular-nums">
                  {stat.money
                    ? formatMoney(stat.value, { currency: DEFAULT_CURRENCY })
                    : stat.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {t("cycleTimesTitle")}
            </p>
            <dl className="mt-3 flex flex-col gap-2">
              {cycleRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="font-medium tabular-nums">
                    {t("dayUnit", { days: row.value.toFixed(1) })}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {t("segmentsTitle")}
            </p>
            <p className="text-xs text-muted-foreground">{t("segmentsDesc")}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">{t("segmentDimension")}</th>
                    <th className="pb-2 pr-3 font-medium">Key</th>
                    <th className="pb-2 pr-3 font-medium">{t("winRate")}</th>
                    <th className="pb-2 font-medium">{t("cashConversion")}</th>
                  </tr>
                </thead>
                <tbody>
                  {segments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-3 text-muted-foreground">
                        {t("emptySegments")}
                      </td>
                    </tr>
                  ) : (
                    segments.map((segment) => (
                      <tr
                        key={`${segment.dimensionLabel}-${segment.dimension}-${segment.key}`}
                        className="border-t border-border/60"
                      >
                        <td className="py-2 pr-3 text-muted-foreground">
                          {segment.dimensionLabel}
                        </td>
                        <td className="py-2 pr-3 font-medium">{segment.key}</td>
                        <td className="py-2 pr-3 tabular-nums">
                          {(segment.winRate * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 tabular-nums">
                          {(segment.cashConversionRate * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
