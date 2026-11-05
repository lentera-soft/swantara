"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { HERO_REVENUE_SERIES } from "./marketing-utils";

const PIPELINE_ROWS = [
  { id: "d1", nameKey: "pipelineDeal1", valueKey: "pipelineDeal1Value", widthClass: "w-4/5" },
  { id: "d2", nameKey: "pipelineDeal2", valueKey: "pipelineDeal2Value", widthClass: "w-3/5" },
  { id: "d3", nameKey: "pipelineDeal3", valueKey: "pipelineDeal3Value", widthClass: "w-2/5" },
] as const;

const INVENTORY_ROWS = [
  { id: "i1", nameKey: "inventoryItem1", valueKey: "inventoryItem1Value", code: "SKU-104" },
  { id: "i2", nameKey: "inventoryItem2", valueKey: "inventoryItem2Value", code: "SKU-208" },
  { id: "i3", nameKey: "inventoryItem3", valueKey: "inventoryItem3Value", code: "SKU-319" },
] as const;

export function HomeErpShowcase() {
  const t = useTranslations("Marketing.home");
  const [activeMetric, setActiveMetric] = useState<"revenue" | "cash" | "orders">("revenue");

  const metrics = [
    {
      id: "revenue" as const,
      label: t("metricRevenue"),
      value: t("metricRevenueValue"),
      trend: t("metricRevenueTrend"),
    },
    {
      id: "cash" as const,
      label: t("metricCash"),
      value: t("metricCashValue"),
      trend: t("metricCashTrend"),
    },
    {
      id: "orders" as const,
      label: t("metricOrders"),
      value: t("metricOrdersValue"),
      trend: t("metricOrdersTrend"),
    },
  ];

  return (
    <div
      data-slot="home-erp-showcase"
      data-gsap="frame"
      className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised"
    >
      <div
        data-gsap-part
        className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-3 sm:px-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full border border-foreground/20" />
            <span className="size-2.5 rounded-full border border-foreground/20" />
          </div>
          <span className="text-sm font-medium text-foreground">{t("heroCardTitle")}</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
          <span>{t("heroStatusLabel")}</span>
        </div>
      </div>

      <div
        data-gsap-part
        className="grid grid-cols-1 divide-y divide-border-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        {metrics.map((metric) => {
          const isSelected = activeMetric === metric.id;
          return (
            <button
              key={metric.id}
              type="button"
              onClick={() => setActiveMetric(metric.id)}
              aria-pressed={isSelected}
              className={cn(
                "flex min-h-[96px] flex-col justify-between p-5 text-left transition-colors",
                isSelected ? "bg-muted/60" : "hover:bg-muted/40",
              )}
            >
              <span className="text-xs text-muted-foreground">{metric.label}</span>
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <span
                  data-gsap="counter"
                  className="text-2xl font-medium tracking-tight tabular-nums sm:text-3xl"
                >
                  {metric.value}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary tabular-nums">
                  {metric.trend}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 divide-y divide-border-subtle lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        <div data-gsap-part className="flex flex-col justify-between p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
            <h3 className="text-sm font-medium">{t("chartTitle")}</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                {t("chartLegendRevenue")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-foreground/15" aria-hidden="true" />
                {t("chartLegendPlan")}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-6 items-end gap-3 pt-4">
            {HERO_REVENUE_SERIES.map((bar) => (
              <div key={bar.id} className="flex flex-col items-center gap-2">
                <div className="flex h-32 w-full items-end justify-center gap-1 border-b border-border-subtle pb-1">
                  <div
                    data-gsap="bar-grow"
                    className={cn("w-2 rounded-sm bg-foreground/15", bar.planHeightClass)}
                  />
                  <div
                    data-gsap="bar-grow"
                    className={cn("w-2 rounded-sm bg-primary", bar.actualHeightClass)}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">P{bar.period}</span>
              </div>
            ))}
          </div>
        </div>

        <div data-gsap-part className="flex flex-col justify-between p-5 sm:p-6 lg:col-span-4">
          <div className="flex items-baseline justify-between gap-2 border-b border-border-subtle pb-3">
            <h3 className="text-sm font-medium">{t("pipelineTitle")}</h3>
            <span className="text-xs text-muted-foreground">{t("pipelineSubtitle")}</span>
          </div>

          <ul className="mt-4 divide-y divide-border-subtle">
            {PIPELINE_ROWS.map((deal) => (
              <li key={deal.id} className="py-3 first:pt-1 last:pb-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{t(deal.nameKey)}</span>
                  <span className="text-sm font-medium tabular-nums">{t(deal.valueKey)}</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                  <div className={cn("h-full rounded-full bg-primary", deal.widthClass)} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div data-gsap-part className="flex flex-col justify-between p-5 sm:p-6 lg:col-span-3">
          <div className="flex items-baseline justify-between gap-2 border-b border-border-subtle pb-3">
            <h3 className="text-sm font-medium">{t("inventoryTitle")}</h3>
            <span className="text-xs text-muted-foreground">{t("inventorySubtitle")}</span>
          </div>

          <ul className="mt-4 divide-y divide-border-subtle">
            {INVENTORY_ROWS.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{t(item.nameKey)}</p>
                  <p className="text-xs text-muted-foreground">{item.code}</p>
                </div>
                <span className="shrink-0 rounded-full border border-border-subtle px-2.5 py-0.5 text-xs text-foreground tabular-nums">
                  {t(item.valueKey)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
