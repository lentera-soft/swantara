"use client";

import { ArrowDownRight, ArrowUpRight, PiggyBank } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { DEFAULT_CURRENCY } from "@/lib/constants/currency";
import { currentMonthRange, useCashFlowReport } from "@/lib/hooks/use-report-queries";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils/style";

const cashFlowIconMap: Record<string, typeof ArrowUpRight> = {
  success: ArrowUpRight,
  destructive: ArrowDownRight,
};
const cashFlowColorMap: Record<string, string> = {
  success: "text-success",
  destructive: "text-destructive",
};

function CashFlowItem({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "success" | "destructive" | "neutral";
}) {
  const Icon = cashFlowIconMap[tone] ?? PiggyBank;
  const color = cashFlowColorMap[tone] ?? "text-foreground";
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className={cn("size-4", color)} aria-hidden />
        {label}
      </span>
      <span className={cn("text-sm tabular-nums", color)}>
        {formatMoney(value, { currency: DEFAULT_CURRENCY })}
      </span>
    </li>
  );
}

export function CashFlowSummary() {
  const t = (
    useTranslations as unknown as (
      ns: string,
    ) => (key: string, values?: Record<string, string | number>) => string
  )("Accounting");
  const { data, isLoading } = useCashFlowReport(currentMonthRange());

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cashFlowTitle")}</CardTitle>
        <CardDescription>{t("cashFlowDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loadingAccounts")}</p>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">{t("journalEntriesEmpty")}</p>
        ) : (
          <ul className="space-y-3">
            <CashFlowItem
              label={t("cashFlowOperating")}
              value={data.operating}
              tone={data.operating >= 0 ? "success" : "destructive"}
            />
            <CashFlowItem
              label={t("cashFlowInvesting")}
              value={data.investing}
              tone={data.investing >= 0 ? "success" : "destructive"}
            />
            <CashFlowItem
              label={t("cashFlowFinancing")}
              value={data.financing}
              tone={data.financing >= 0 ? "success" : "destructive"}
            />
            <CashFlowItem
              label={t("cashFlowNet")}
              value={data.netChange}
              tone={data.netChange >= 0 ? "success" : "destructive"}
            />
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
