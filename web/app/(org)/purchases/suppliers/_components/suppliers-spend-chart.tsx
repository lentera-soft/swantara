"use client";

import { useLocale, useTranslations } from "next-intl";
import { BarChart } from "@/components/bar-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { useActiveOrgCurrency } from "@/lib/hooks/use-org-context";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { ListQuery, PurchaseOrder } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatMoney } from "@/lib/utils";

const MONTHS = 6;

function buildSpendSeries(orders: PurchaseOrder[], locale: string, now = new Date()) {
  const series: Array<{ key: string; label: string; value: number }> = [];
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short" });

  for (let offset = MONTHS - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    series.push({
      key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`,
      label: monthFormatter.format(date),
      value: 0,
    });
  }

  const byKey = new Map(series.map((point) => [point.key, point]));
  for (const order of orders) {
    if (!order.orderDate || order.state === "cancelled") continue;
    const date = new Date(order.orderDate);
    const point = byKey.get(`${date.getUTCFullYear()}-${date.getUTCMonth()}`);
    if (point) point.value += order.amountTotal;
  }

  return series.map(({ label, value }) => ({ label, value }));
}

export function SuppliersSpendChart() {
  const t = useTranslations("Purchases");
  const locale = useLocale();
  const orgCurrency = useActiveOrgCurrency();
  const ordersQuery = useOrgListQuery<{ orders: PurchaseOrder[] }, ListQuery>(
    "supplierSpendOrders",
    (organizationId, params) => getSwantaraService().purchaseOrders.list(organizationId, params),
    { size: 100, sort: "order_date:desc" },
  );

  const data = buildSpendSeries(ordersQuery.data?.orders ?? [], locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("spendByMonth")}</CardTitle>
        <CardDescription>{t("spendByMonthDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <BarChart
          data={data}
          ariaLabel={t("spendByMonth")}
          valueFormatter={(value) => formatMoney(value, { currency: orgCurrency })}
        />
      </CardContent>
    </Card>
  );
}
