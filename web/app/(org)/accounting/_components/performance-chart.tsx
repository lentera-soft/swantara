"use client";

import { useTranslations } from "next-intl";
import { BarChart } from "@/components/bar-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { DEFAULT_CURRENCY } from "@/lib/constants/currency";
import { useProfitAndLoss, useReportPeriod } from "@/lib/hooks/use-report-queries";
import { formatMoney } from "@/lib/utils";

export function PerformanceChart() {
  const t = (
    useTranslations as unknown as (
      ns: string,
    ) => (key: string, values?: Record<string, string | number>) => string
  )("Accounting");
  const { params, enabled } = useReportPeriod();
  const { data, isLoading } = useProfitAndLoss(params, { enabled });

  const chartData = data
    ? [
        { label: t("statRevenue"), value: data.revenue },
        { label: t("statExpenses"), value: data.expenses },
        { label: t("statNetProfit"), value: data.netIncome },
      ]
    : [];

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{t("performanceTitle")}</CardTitle>
        <CardDescription>{t("performanceDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loadingAccounts")}</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("journalEntriesEmpty")}</p>
        ) : (
          <BarChart
            data={chartData}
            ariaLabel={t("performanceTitle")}
            valueFormatter={(value) => formatMoney(value, { currency: DEFAULT_CURRENCY })}
          />
        )}
      </CardContent>
    </Card>
  );
}
