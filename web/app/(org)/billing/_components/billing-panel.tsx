"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  Check,
  CreditCard,
  Download,
  FileText,
  Plus,
  RefreshCw,
  Sparkles,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { MetricGrid } from "@/components/metric-grid";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/progress";
import { Skeleton } from "@/components/skeleton";
import { StatCard } from "@/components/stat-card";
import { StateBadge } from "@/components/state-badge";
import { DEFAULT_CURRENCY } from "@/lib/constants/currency";
import { useOrganizationId } from "@/lib/hooks/use-org-context";
import type { GatewayInvoice } from "@/lib/services/billing-gateway";
import {
  getBillingGateway,
  openOutstandingInvoices,
  outstandingTotal,
  paidThisYear,
} from "@/lib/services/billing-gateway";
import { formatDate, formatMoney } from "@/lib/utils";

const invoiceStatusTones = {
  paid: "success",
  open: "warning",
  overdue: "danger",
  void: "neutral",
} as const;

function money(value: number, currency?: string): string {
  return formatMoney(value, { currency: currency ?? DEFAULT_CURRENCY });
}

export function BillingPanel() {
  const t = useTranslations("Billing");
  const organizationId = useOrganizationId();

  const summaryQuery = useQuery({
    queryKey: ["billingGatewaySummary", organizationId],
    queryFn: () => getBillingGateway().fetchSummary(organizationId as number),
    enabled: organizationId != null,
  });

  const plan = summaryQuery.data?.plan;
  const invoices = summaryQuery.data?.invoices ?? [];
  const paymentMethods = summaryQuery.data?.paymentMethods ?? [];
  const outstanding = outstandingTotal(invoices);
  const dueInvoices = openOutstandingInvoices(invoices);

  function notConnected() {
    toast.info(t("gatewayPending"));
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="outline" className="gap-1.5 text-xs">
          <Sparkles className="size-3" />
          {t("placeholderTitle")}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => summaryQuery.refetch()}
          disabled={summaryQuery.isFetching}
        >
          <RefreshCw className={summaryQuery.isFetching ? "animate-spin" : undefined} />
          {summaryQuery.isFetching ? t("refreshing") : t("refresh")}
        </Button>
      </div>

      <MetricGrid>
        <StatCard
          label={t("statNextBilling")}
          value={plan ? formatDate(plan.renewsAt) : "—"}
          icon={CalendarClock}
          trend={t("renewsHint")}
        />
        <StatCard
          label={t("statOutstanding")}
          value={money(outstanding)}
          icon={Wallet}
          trend={t("openCount", { count: dueInvoices.length })}
          trendDirection={outstanding > 0 ? "down" : "up"}
        />
        <StatCard label={t("statPaidYear")} value={money(paidThisYear(invoices))} icon={Check} />
        <StatCard label={t("statPlan")} value={plan?.name ?? "—"} icon={Sparkles} />
      </MetricGrid>

      <div className="grid items-start gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Card className="border-primary/40 bg-gradient-to-br from-card to-muted/40">
            <CardContent>
              {summaryQuery.isLoading ? (
                <PlanSkeleton />
              ) : plan ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("currentPlan")}</p>
                      <div className="flex items-center gap-2">
                        <p className="font-heading text-2xl font-semibold">{plan.name}</p>
                        <StateBadge
                          tone={plan.status === "active" ? "success" : "warning"}
                          label={t(`planState_${plan.status}`)}
                        />
                      </div>
                    </div>
                    <p className="font-heading text-2xl font-semibold tabular-nums">
                      {money(plan.pricePerPeriod, plan.currency)}
                      <span className="text-sm font-normal text-muted-foreground">
                        {t(`interval_${plan.interval}`)}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("seatsUsed")}</span>
                      <span className="tabular-nums">
                        {plan.seatsUsed} / {plan.seatsLimit}
                      </span>
                    </div>
                    <Progress value={(plan.seatsUsed / plan.seatsLimit) * 100}>
                      <ProgressTrack className="h-2">
                        <ProgressIndicator className="h-2 bg-primary" />
                      </ProgressTrack>
                    </Progress>
                  </div>

                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="size-4 shrink-0 text-success" />
                        {t(`feature_${feature}`)}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <p className="text-sm text-muted-foreground">
                      <CalendarClock className="mr-1 inline size-4 align-text-bottom" />
                      {t("renewsOn", { date: formatDate(plan.renewsAt) })}
                    </p>
                    <Button size="sm" variant="outline" onClick={notConnected}>
                      {t("changePlan")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("invoicesTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {summaryQuery.isLoading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : invoices.length === 0 ? (
                <EmptyState
                  title={t("invoicesEmpty")}
                  description={t("invoicesEmptyDescription")}
                  icon={FileText}
                />
              ) : (
                invoices.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} onPay={notConnected} />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {outstanding > 0 ? (
            <Card className="border-warning">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <Wallet className="size-4" />
                  {t("dueTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="font-heading text-2xl font-semibold tabular-nums">
                  {money(outstanding)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("openCount", { count: dueInvoices.length })}
                </p>
                <Button size="sm" onClick={notConnected}>
                  {t("payNow")}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                {t("paymentMethodsTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="size-4 text-muted-foreground" />
                    <span className="capitalize">{method.brand}</span>
                    <span className="text-muted-foreground">•••• {method.last4}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {method.isDefault ? (
                      <Badge variant="outline" className="text-xs">
                        {t("defaultMethod")}
                      </Badge>
                    ) : null}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {String(method.expiryMonth).padStart(2, "0")}/{method.expiryYear}
                    </span>
                  </span>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={notConnected}>
                <Plus />
                {t("addPaymentMethod")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("billingContactTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>{t("billingContactHint")}</p>
              <Button variant="outline" size="sm" asChild className="self-start">
                <Link href="/settings">{t("openSettings")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InvoiceRow({ invoice, onPay }: { invoice: GatewayInvoice; onPay: () => void }) {
  const t = useTranslations("Billing");
  const balance = invoice.amount - invoice.paidAmount;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <FileText className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{invoice.number}</p>
          <p className="truncate text-xs text-muted-foreground">
            {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StateBadge
          tone={invoiceStatusTones[invoice.status]}
          label={t(`invoiceState_${invoice.status}`)}
          className="hidden sm:inline-flex"
        />
        <div className="text-right">
          <p className="text-sm font-medium tabular-nums">
            {money(invoice.amount, invoice.currency)}
          </p>
          {invoice.status !== "paid" && balance > 0 ? (
            <p className="text-xs text-muted-foreground tabular-nums">
              {t("balance", { value: money(balance, invoice.currency) })}
            </p>
          ) : null}
        </div>
        {invoice.status === "paid" ? (
          <Button variant="ghost" size="sm" onClick={onPay} aria-label={t("downloadReceipt")}>
            <Download />
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onPay}>
            {t("payNow")}
          </Button>
        )}
      </div>
    </div>
  );
}

function PlanSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}
