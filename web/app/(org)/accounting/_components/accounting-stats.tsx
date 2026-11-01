"use client";

import { useIsRestoring } from "@tanstack/react-query";
import { Banknote, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

import { MetricGrid } from "@/components/metric-grid";
import { StatCard } from "@/components/stat-card";
import { DEFAULT_CURRENCY } from "@/lib/constants/currency";
import { useCashKpi, useFinanceKpi } from "@/lib/hooks/use-dashboard-kpis";
import { formatMoney } from "@/lib/utils";

type TFn = (key: string, values?: Record<string, string | number>) => string;

export function AccountingStats() {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Accounting");
  const { data: financeData } = useFinanceKpi();
  const { data: cashData } = useCashKpi();

  const kpi = financeData;
  const cashKpi = cashData;
  const isRestoring = useIsRestoring();

  return (
    <MetricGrid>
      <StatCard
        label={t("statRevenue")}
        value={isRestoring || !kpi ? "—" : formatMoney(kpi.revenue, { currency: DEFAULT_CURRENCY })}
        icon={Banknote}
      />
      <StatCard
        label={t("statExpenses")}
        value={
          isRestoring || !kpi ? "—" : formatMoney(kpi.expenses, { currency: DEFAULT_CURRENCY })
        }
        icon={Receipt}
      />
      <StatCard
        label={t("statNetProfit")}
        value={isRestoring || !kpi ? "—" : formatMoney(kpi.ebitda, { currency: DEFAULT_CURRENCY })}
        icon={TrendingUp}
        trend={
          isRestoring || !kpi
            ? undefined
            : t("trendMargin", { value: (kpi.netMarginPct * 100).toFixed(0) })
        }
      />
      <StatCard
        label={t("statCashBalance")}
        value={
          isRestoring || !cashKpi
            ? "—"
            : formatMoney(cashKpi.position, { currency: DEFAULT_CURRENCY })
        }
        icon={Wallet}
        trend={
          isRestoring || !cashKpi
            ? undefined
            : t("trendForecast", {
                value: formatMoney(cashKpi.forecast, { currency: DEFAULT_CURRENCY }),
              })
        }
        trendDirection={cashKpi && cashKpi.burn > 0 ? "down" : undefined}
      />
    </MetricGrid>
  );
}
