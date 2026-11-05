"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { saleOrderStateTone } from "@/app/(org)/sale-orders/_components/sale-order-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { StateBadge } from "@/components/state-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { SaleOrder } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDate, formatNumber } from "@/lib/utils";

const ORDER_STATE_LABEL_KEYS = {
  draft: "orderStateDraft",
  sent: "orderStateSent",
  confirmed: "orderStateConfirmed",
  done: "orderStateDone",
  cancelled: "orderStateCancelled",
} as const;

export function CustomerOrdersSection({
  orgId: _orgId,
  customerId,
}: {
  orgId: string;
  customerId: string;
}) {
  const t = useTranslations("Sales");
  const tCommon = useTranslations("Common");
  const numericCustomerId = Number(customerId);

  const ordersQuery = useOrgListQuery<{ orders: SaleOrder[] }, { size: number; filter: string[] }>(
    "saleOrders",
    (organizationId, params) => getSwantaraService().saleOrders.list(organizationId, params),
    { size: 50, filter: [`contact_id:eq:${numericCustomerId}`] },
    { enabled: Number.isFinite(numericCustomerId) && numericCustomerId > 0 },
  );

  const orders = ordersQuery.data?.orders ?? [];

  if (ordersQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("tabOrders")}</CardTitle>
        </CardHeader>
        <CardContent>
          <output aria-busy="true" className="flex flex-col gap-2">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-10 animate-pulse rounded-md bg-muted" aria-hidden />
            ))}
          </output>
        </CardContent>
      </Card>
    );
  }

  if (ordersQuery.isError) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("loadFailed")}
        <button type="button" className="ms-2 underline" onClick={() => void ordersQuery.refetch()}>
          {tCommon("retry")}
        </button>
      </p>
    );
  }

  if (orders.length === 0) {
    return <EmptyState icon={ShoppingBag} title={t("emptyOrders")} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tabOrders")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tableNumber")}</TableHead>
              <TableHead>{t("tableOrderDate")}</TableHead>
              <TableHead>{t("tableStatus")}</TableHead>
              <TableHead className="text-right">{t("tableTotal")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link href={`/sale-orders/${order.id}`} className="font-medium hover:underline">
                    {order.name || String(order.id)}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(order.orderDate)}
                </TableCell>
                <TableCell>
                  <StateBadge
                    tone={saleOrderStateTone(order.state)}
                    label={t(ORDER_STATE_LABEL_KEYS[order.state])}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(order.amountTotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
