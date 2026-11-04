"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24 font-medium">{t("fieldCode")}</TableHead>
                <TableHead className="font-medium">{t("fieldName")}</TableHead>
                <TableHead className="w-32 font-medium">{t("fieldType")}</TableHead>
                <TableHead className="w-36 text-right font-medium">{t("colBalance")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.accountId}>
                  <TableCell className="font-mono">{account.code}</TableCell>
                  <TableCell className="max-w-40 truncate">{account.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {account.accountType}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-sm tabular-nums",
                      account.balance >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {formatMoney(account.balance, { currency: DEFAULT_CURRENCY })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
