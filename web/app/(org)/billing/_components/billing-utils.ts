import type { InvoiceSummary, Subscription } from "@/lib/services/swantara";

export function isOpenInvoice(invoice: InvoiceSummary): boolean {
  return (
    invoice.state === "posted" &&
    invoice.paymentState !== "paid" &&
    invoice.paymentState !== "reversed" &&
    invoice.paymentState !== "bad_debt"
  );
}

export function outstandingTotal(invoices: InvoiceSummary[]): number {
  return invoices
    .filter(isOpenInvoice)
    .reduce((total, invoice) => total + invoice.amountResidual, 0);
}

export function openInvoiceCount(invoices: InvoiceSummary[]): number {
  return invoices.filter(isOpenInvoice).length;
}

export function upcomingRenewals(subscriptions: Subscription[], limit = 5): Subscription[] {
  return subscriptions
    .filter(
      (subscription) => subscription.state === "active" && subscription.nextInvoiceDate != null,
    )
    .sort(
      (a, b) =>
        new Date(a.nextInvoiceDate as Date).getTime() -
        new Date(b.nextInvoiceDate as Date).getTime(),
    )
    .slice(0, limit);
}

export type PaymentLabelKey =
  | "payment_not_paid"
  | "payment_in_payment"
  | "payment_partial"
  | "payment_paid"
  | "payment_reversed"
  | "payment_bad_debt";

const paymentLabelKeys = {
  not_paid: "payment_not_paid",
  in_payment: "payment_in_payment",
  partial: "payment_partial",
  paid: "payment_paid",
  reversed: "payment_reversed",
  bad_debt: "payment_bad_debt",
} as const;

export function paymentLabelKey(state: string): PaymentLabelKey | null {
  return paymentLabelKeys[state as keyof typeof paymentLabelKeys] ?? null;
}

export type IntervalLabelKey =
  | "interval_daily"
  | "interval_weekly"
  | "interval_monthly"
  | "interval_quarterly"
  | "interval_yearly";

const intervalLabelKeys = {
  daily: "interval_daily",
  day: "interval_daily",
  weekly: "interval_weekly",
  week: "interval_weekly",
  monthly: "interval_monthly",
  month: "interval_monthly",
  quarterly: "interval_quarterly",
  quarter: "interval_quarterly",
  yearly: "interval_yearly",
  year: "interval_yearly",
} as const;

export function intervalLabelKey(interval: string): IntervalLabelKey | null {
  return intervalLabelKeys[interval as keyof typeof intervalLabelKeys] ?? null;
}

export function paymentStateTone(
  state: InvoiceSummary["paymentState"],
): "success" | "warning" | "info" | "neutral" {
  switch (state) {
    case "paid":
      return "success";
    case "partial":
      return "warning";
    case "in_payment":
      return "info";
    default:
      return "neutral";
  }
}

export function subscriptionStateTone(
  state: Subscription["state"],
): "success" | "warning" | "info" | "neutral" {
  switch (state) {
    case "active":
      return "success";
    case "paused":
      return "warning";
    case "draft":
      return "neutral";
    case "churned":
    case "closed":
      return "info";
    default:
      return "neutral";
  }
}
