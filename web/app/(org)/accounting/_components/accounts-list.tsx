"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { DEFAULT_CURRENCY } from "@/lib/constants/currency";
import { useReportPeriod, useTrialBalance } from "@/lib/hooks/use-report-queries";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils/style";

type TFn = (key: string, values?: Record<string, string | number>) => string;

export function AccountsList() {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Accounting");
  const { params, enabled } = useReportPeriod();
  const { data, isLoading } = useTrialBalance(params, { enabled });

  const accounts = (data?.rows ?? [])
    .map((row) => ({ ...row, balance: row.closingDebit - row.closingCredit }))
    .filter((row) => row.balance !== 0)
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
    .slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("overviewTitle")}</CardTitle>
        <CardDescription>{t("overviewDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loadingAccounts")}</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("accountsEmpty")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <div
                key={account.accountId}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm">{account.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{account.code}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <Badge variant="outline" className="text-xs">
                    {account.accountType}
                  </Badge>
                  <span
                    className={cn(
                      "text-sm tabular-nums",
                      account.balance >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {formatMoney(account.balance, { currency: DEFAULT_CURRENCY })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
