"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ApprovalWidget } from "@/app/(org)/approval-requests/_components/approval-widget-section";
import { DetailPageSkeleton } from "@/components/detail-page-skeleton";
import { JournalDateDialog } from "@/components/journal-date-dialog";
import { PaymentDialog } from "@/components/payment-dialog";
import { RecordAttachmentsMessages } from "@/components/record-attachments-messages";
import { RecordLayout } from "@/components/record-layout";
import { StateBadge } from "@/components/state-badge";
import { AdvanceInvoiceDialog } from "./advance-invoice-dialog";
import { DeductDepositDialog } from "./deduct-deposit-dialog";
import { SaleOrderDeliveryTab } from "./sale-order-delivery-tab";
import { useSaleOrderDetail } from "./sale-order-detail-hooks";
import { SaleOrderInvoicingTab } from "./sale-order-invoicing-tab";
import { SaleOrderOverviewTab } from "./sale-order-overview-tab";
import { SaleOrderPaymentsTab } from "./sale-order-payments-tab";
import { SaleOrderReminderTab } from "./sale-order-reminder-tab";
import { getOrderStatuses } from "./sale-order-status";

type SaleOrderDetailProps = {
  orgId: string;
  saleOrderId: string;
};

export function SaleOrderDetail({ orgId, saleOrderId }: SaleOrderDetailProps) {
  const t = useTranslations("Sales");
  const tCommon = useTranslations("Common");
  const [activeDialog, setActiveDialog] = useState<
    "deliver" | "invoice" | "advance" | "deposit" | "pay" | null
  >(null);
  const detail = useSaleOrderDetail(orgId, saleOrderId);
  const { order, isLoading, journals } = detail;

  function orderStatusLabel(state: string): string {
    try {
      return (t as unknown as (k: string) => string)(`orderState.${state}`);
    } catch {
      return state;
    }
  }

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!order) {
    return <p className="text-sm text-muted-foreground">{t("orderNotFound")}</p>;
  }

  return (
    <>
      <RecordLayout
        breadcrumbItems={[
          { label: t("allSaleOrders"), href: "/sale-orders" },
          { label: order.name ?? `SO-${order.id}` },
        ]}
        title={order.name ?? `SO-${order.id}`}
        status={<StateBadge value={order.state} statuses={getOrderStatuses(orderStatusLabel)} />}
        tabs={[
          {
            id: "overview",
            label: t("tabOverview"),
            content: (
              <div className="flex flex-col gap-4">
                <SaleOrderOverviewTab
                  order={order}
                  contactMap={detail.contactMap}
                  priceBookMap={detail.priceBookMap}
                  warehouseMap={detail.warehouseMap}
                  opportunityMap={detail.opportunityMap}
                  onSend={detail.send}
                  onConfirm={detail.confirm}
                  onCancel={detail.cancel}
                  onDone={detail.markDone}
                />
                <ApprovalWidget
                  approvalRequest={detail.approvalRequest}
                  orgId={orgId}
                  onDecided={detail.refreshOrder}
                />
              </div>
            ),
          },
          {
            id: "delivery",
            label: t("tabDelivery"),
            content: (
              <SaleOrderDeliveryTab
                order={order}
                linkedShipment={detail.linkedShipment}
                onDeliver={() => setActiveDialog("deliver")}
              />
            ),
          },
          {
            id: "invoicing",
            label: t("tabInvoicing"),
            content: (
              <SaleOrderInvoicingTab
                order={order}
                deliveredUnbilledLines={detail.deliveredUnbilledLines}
                orderInvoices={detail.orderInvoices}
                onInvoice={() => setActiveDialog("invoice")}
                onAdvanceInvoice={() => setActiveDialog("advance")}
                onDeductDeposit={() => setActiveDialog("deposit")}
              />
            ),
          },
          {
            id: "payments",
            label: t("tabPayments"),
            content: <SaleOrderPaymentsTab order={order} onPay={() => setActiveDialog("pay")} />,
          },
          {
            id: "reminder",
            label: t("tabReminder"),
            content: (
              <SaleOrderReminderTab
                reminders={detail.reminders}
                onGenerate={detail.generateReminder}
              />
            ),
          },
        ]}
      />
      <RecordAttachmentsMessages orgId={orgId} ownerType="sale_order" ownerId={order.id} />
      <JournalDateDialog
        title={t("deliverTitle")}
        description={t("deliverDescription")}
        confirmLabel={t("deliverTitle")}
        cancelLabel={tCommon("cancel")}
        open={activeDialog === "deliver"}
        onOpenChange={(open) => setActiveDialog(open ? "deliver" : null)}
        onConfirm={(journalId, date) => {
          detail.deliver({ journalId, date });
          setActiveDialog(null);
        }}
        journals={journals}
      />
      <JournalDateDialog
        title={t("invoiceTitle")}
        description={t("invoiceDescription")}
        confirmLabel={t("invoiceTitle")}
        cancelLabel={tCommon("cancel")}
        open={activeDialog === "invoice"}
        onOpenChange={(open) => setActiveDialog(open ? "invoice" : null)}
        onConfirm={(journalId, date) => {
          detail.invoice({ journalId, date });
          setActiveDialog(null);
        }}
        journals={journals}
      />
      <AdvanceInvoiceDialog
        title={t("advanceInvoiceTitle")}
        description={t("advanceInvoiceDescription")}
        confirmLabel={t("advanceInvoiceTitle")}
        cancelLabel={tCommon("cancel")}
        open={activeDialog === "advance"}
        onOpenChange={(open) => setActiveDialog(open ? "advance" : null)}
        onConfirm={(values) => {
          detail.advanceInvoice(values);
          setActiveDialog(null);
        }}
        journals={journals}
      />
      <DeductDepositDialog
        title={t("deductDepositTitle")}
        description={t("deductDepositDescription")}
        confirmLabel={t("deductDepositTitle")}
        cancelLabel={tCommon("cancel")}
        open={activeDialog === "deposit"}
        onOpenChange={(open) => setActiveDialog(open ? "deposit" : null)}
        onConfirm={(values) => {
          detail.deductDeposit(values);
          setActiveDialog(null);
        }}
        invoices={detail.orderInvoices}
      />
      <PaymentDialog
        title={t("payTitle")}
        description={t("payDescription")}
        confirmLabel={t("payTitle")}
        cancelLabel={tCommon("cancel")}
        open={activeDialog === "pay"}
        onOpenChange={(open) => setActiveDialog(open ? "pay" : null)}
        onConfirm={(values) => {
          detail.pay(
            values as { journalId: string; amount: string; date: string; onAccount?: boolean },
          );
          setActiveDialog(null);
        }}
        journals={journals}
        showAmount
        showOnAccount
      />
    </>
  );
}
