"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import type { InvoiceSummary, SaleOrder, SaleOrderLine } from "@/lib/services/swantara";
import { formatNumber } from "@/lib/utils";

type SaleOrderInvoicingTabProps = {
  order: SaleOrder;
  deliveredUnbilledLines: SaleOrderLine[];
  orderInvoices: InvoiceSummary[];
  onInvoice: () => void;
  onAdvanceInvoice: () => void;
  onDeductDeposit: () => void;
};

export function SaleOrderInvoicingTab({
  order,
  deliveredUnbilledLines,
  orderInvoices,
  onInvoice,
  onAdvanceInvoice,
  onDeductDeposit,
}: SaleOrderInvoicingTabProps) {
  const t = useTranslations("Sales");
  const orderLines = order.lines ?? [];
  const remainingToInvoice = orderLines.filter(
    (line) => line.qtyOrdered - line.qtyInvoiced > 0,
  ).length;
  const canAdvanceInvoice =
    (order.state === "confirmed" || order.state === "done") && remainingToInvoice > 0;
  const advanceInvoices = orderInvoices.filter((invoice) => invoice.isAdvance);
  const finalInvoices = orderInvoices.filter((invoice) => !invoice.isAdvance);
  const canDeductDeposit = advanceInvoices.length > 0 && finalInvoices.length > 0;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("tabInvoicing")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("invoiceDescription")}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {deliveredUnbilledLines.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noBillableLines")}</p>
          ) : (
            <>
              <p className="text-sm">
                {t("linesToInvoice")}: {deliveredUnbilledLines.length}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-2 text-left">{t("fieldItem")}</th>
                      <th className="pb-2 text-right">{t("deliveredNotInvoiced")}</th>
                      <th className="pb-2 text-right">{t("unitPrice")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveredUnbilledLines.map((line) => (
                      <tr key={line.id} className="border-b">
                        <td className="py-2">{line.itemId}</td>
                        <td className="py-2 text-right tabular-nums">
                          {formatNumber(line.qtyDelivered - line.qtyInvoiced)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatNumber(line.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <Button size="sm" onClick={onInvoice} disabled={deliveredUnbilledLines.length === 0}>
            {t("invoiceTitle")}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("advanceInvoiceTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("advanceInvoiceDescription")}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {remainingToInvoice === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noRemainingToInvoice")}</p>
          ) : (
            <p className="text-sm">
              {t("ordered")}:{" "}
              {formatNumber(orderLines.reduce((sum, line) => sum + line.qtyOrdered, 0))}
            </p>
          )}
          <Button size="sm" onClick={onAdvanceInvoice} disabled={!canAdvanceInvoice}>
            {t("advanceInvoiceTitle")}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("deductDepositTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("deductDepositDescription")}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!canDeductDeposit ? (
            <p className="text-sm text-muted-foreground">{t("deductDepositNoInvoices")}</p>
          ) : (
            <p className="text-sm">
              {t("deductDepositReady", { count: advanceInvoices.length + finalInvoices.length })}
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onDeductDeposit}
            disabled={!canDeductDeposit}
          >
            {t("deductDepositTitle")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
