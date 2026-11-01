"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CreditCard,
  FileText,
  RefreshCw,
  Repeat,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { MetricGrid } from "@/components/metric-grid";
import { StatCard } from "@/components/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { DEFAULT_CURRENCY } from "@/lib/constants/currency";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import { usePermissions } from "@/lib/hooks/use-permissions";
import type {
  InvoiceSummary,
  ListQuery,
  Subscription,
  SubscriptionMetrics,
  SubscriptionPlan,
} from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDate, formatMoney } from "@/lib/utils";
import {
  intervalLabelKey,
  openInvoiceCount,
  outstandingTotal,
  paymentLabelKey,
  paymentStateTone,
  subscriptionStateTone,
  upcomingRenewals,
} from "./billing-utils";

const toneClass = {
  success: "border-success text-success",
  warning: "border-warning text-warning",
  info: "border-info text-info",
  neutral: "",
} as const;

const renewalParams: ListQuery = { size: 100, sort: "next_invoice_date:asc" };
const invoiceParams: ListQuery = {
  size: 100,
  sort: "invoice_date:desc",
  filter: ["type:eq:customer_invoice"],
};
const planParams: ListQuery = { size: 100, sort: "name:asc" };

export function BillingSection() {
  const t = useTranslations("Billing");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [tab, setTab] = useState("overview");

  const canViewSubscriptions = !permissions.isLoading && permissions.has("subscription.view");
  const canViewInvoices = !permissions.isLoading && permissions.has("invoice.view");

  const metricsQuery = useOrgListQuery<SubscriptionMetrics, Record<string, never>>(
    "billingMetrics",
    (organizationId) => getSwantaraService().subscriptions.metrics(organizationId),
    undefined,
    { enabled: canViewSubscriptions },
  );

  const subscriptionsQuery = useOrgListQuery<{ subscriptions: Subscription[] }, ListQuery>(
    "billingSubscriptions",
    (organizationId, params) => getSwantaraService().subscriptions.list(organizationId, params),
    renewalParams,
    { enabled: canViewSubscriptions },
  );

  const plansQuery = useOrgListQuery<{ plans: SubscriptionPlan[] }, ListQuery>(
    "billingPlans",
    (organizationId, params) => getSwantaraService().subscriptionPlans.list(organizationId, params),
    planParams,
    { enabled: canViewSubscriptions },
  );

  const invoicesQuery = useOrgListQuery<{ invoices: InvoiceSummary[] }, ListQuery>(
    "billingInvoices",
    (organizationId, params) => getSwantaraService().invoices.list(organizationId, params),
    invoiceParams,
    { enabled: canViewInvoices },
  );

  const metrics = metricsQuery.data;
  const subscriptions = subscriptionsQuery.data?.subscriptions ?? [];
  const plans = plansQuery.data?.plans ?? [];
  const invoices = invoicesQuery.data?.invoices ?? [];
  const renewals = upcomingRenewals(subscriptions);
  const recentInvoices = invoices.slice(0, 6);
  const outstanding = outstandingTotal(invoices);
  const openInvoices = openInvoiceCount(invoices);

  const isFetching =
    metricsQuery.isFetching ||
    subscriptionsQuery.isFetching ||
    plansQuery.isFetching ||
    invoicesQuery.isFetching;

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["billingMetrics"] });
    void queryClient.invalidateQueries({ queryKey: ["billingSubscriptions"] });
    void queryClient.invalidateQueries({ queryKey: ["billingPlans"] });
    void queryClient.invalidateQueries({ queryKey: ["billingInvoices"] });
  }

  const noAccess = !permissions.isLoading && !canViewSubscriptions && !canViewInvoices;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={refresh} disabled={isFetching || noAccess}>
          <RefreshCw className={isFetching ? "animate-spin" : undefined} />
          {isFetching ? t("refreshing") : t("refresh")}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/subscriptions">
            {t("viewSubscriptions")}
            <ArrowRight />
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/subscriptions/plans">{t("managePlans")}</Link>
        </Button>
      </div>

      <MetricGrid>
        <StatCard
          label={t("statMrr")}
          value={formatMoney(metrics?.mrr ?? 0, { currency: DEFAULT_CURRENCY })}
          icon={TrendingUp}
        />
        <StatCard
          label={t("statArr")}
          value={formatMoney(metrics?.arr ?? 0, { currency: DEFAULT_CURRENCY })}
          icon={Repeat}
        />
        <StatCard
          label={t("statOutstanding")}
          value={formatMoney(outstanding, { currency: DEFAULT_CURRENCY })}
          icon={Wallet}
          trend={t("outstandingHint", { count: openInvoices })}
          trendDirection="down"
        />
        <StatCard
          label={t("statChurn")}
          value={`${((metrics?.churnRate ?? 0) * 100).toFixed(1)}%`}
          icon={CreditCard}
        />
      </MetricGrid>

      {noAccess ? (
        <Card>
          <CardContent>
            <EmptyState
              title={t("permissionTitle")}
              description={t("permissionHint")}
              icon={CreditCard}
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs value={tab} onValueChange={(value) => setTab(value as string)}>
          <TabsList variant="line">
            <TabsTrigger value="overview">{t("tabOverview")}</TabsTrigger>
            <TabsTrigger value="plans">{t("tabPlans")}</TabsTrigger>
            <TabsTrigger value="invoices">{t("tabInvoices")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("upcomingRenewalsTitle")}</CardTitle>
                  <CardDescription>{t("upcomingRenewalsDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {subscriptionsQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
                  ) : renewals.length === 0 ? (
                    <EmptyState
                      title={t("renewalsEmpty")}
                      description={t("renewalsEmptyDescription")}
                      icon={Repeat}
                    />
                  ) : (
                    <Table aria-label={t("upcomingRenewalsTitle")}>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("colSubscription")}</TableHead>
                          <TableHead>{t("colNextInvoice")}</TableHead>
                          <TableHead className="text-right">{t("colMrr")}</TableHead>
                          <TableHead className="text-right">{t("colStatus")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renewals.map((subscription) => (
                          <TableRow key={subscription.id}>
                            <TableCell>
                              <Link
                                href={`/subscriptions/${subscription.id}`}
                                className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {subscription.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(subscription.nextInvoiceDate)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(subscription.mrr, {
                                currency: subscription.currencyCode ?? DEFAULT_CURRENCY,
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className={toneClass[subscriptionStateTone(subscription.state)]}
                              >
                                {t(`state_${subscription.state}`)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle>{t("recentInvoicesTitle")}</CardTitle>
                    <CardDescription>{t("recentInvoicesDescription")}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/accounting/invoices">
                      {t("viewAllInvoices")}
                      <ArrowRight />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {invoicesQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
                  ) : recentInvoices.length === 0 ? (
                    <EmptyState
                      title={t("invoicesEmpty")}
                      description={t("invoicesEmptyDescription")}
                      icon={FileText}
                    />
                  ) : (
                    <Table aria-label={t("recentInvoicesTitle")}>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("colInvoice")}</TableHead>
                          <TableHead>{t("colCustomer")}</TableHead>
                          <TableHead>{t("colDate")}</TableHead>
                          <TableHead className="text-right">{t("colTotal")}</TableHead>
                          <TableHead className="text-right">{t("colPaymentStatus")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentInvoices.map((invoice) => {
                          const paymentKey = paymentLabelKey(invoice.paymentState);
                          return (
                            <TableRow key={invoice.id}>
                              <TableCell>
                                <Link
                                  href={`/accounting/invoices/${invoice.id}`}
                                  className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  {invoice.name ?? invoice.reference ?? `#${invoice.id}`}
                                </Link>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                #{invoice.contactId}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(invoice.invoiceDate)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatMoney(invoice.amountTotal, { currency: DEFAULT_CURRENCY })}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className={toneClass[paymentStateTone(invoice.paymentState)]}
                                >
                                  {paymentKey ? t(paymentKey) : invoice.paymentState}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>{t("billingContactTitle")}</CardTitle>
                <CardDescription>{t("billingContactDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{t("billingContactHint")}</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings">{t("openSettings")}</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("plansTitle")}</CardTitle>
                <CardDescription>{t("plansDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                {plansQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
                ) : plans.length === 0 ? (
                  <EmptyState
                    title={t("plansEmpty")}
                    description={t("plansEmptyDescription")}
                    icon={Repeat}
                  >
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/subscriptions/plans">{t("managePlans")}</Link>
                    </Button>
                  </EmptyState>
                ) : (
                  <Table aria-label={t("plansTitle")}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("colPlan")}</TableHead>
                        <TableHead>{t("colInterval")}</TableHead>
                        <TableHead>{t("colCount")}</TableHead>
                        <TableHead className="text-right">{t("colActions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans.map((plan) => {
                        const intervalKey = intervalLabelKey(plan.recurringInterval);
                        return (
                          <TableRow key={plan.id}>
                            <TableCell className="font-medium">{plan.name}</TableCell>
                            <TableCell>
                              {intervalKey ? t(intervalKey) : plan.recurringInterval}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {plan.recurringCount}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href="/subscriptions/plans">{t("managePlans")}</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="pt-4">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>{t("invoicesTitle")}</CardTitle>
                  <CardDescription>{t("invoicesDescription")}</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/accounting/invoices">{t("viewAllInvoices")}</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {invoicesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
                ) : invoices.length === 0 ? (
                  <EmptyState
                    title={t("invoicesEmpty")}
                    description={t("invoicesEmptyDescription")}
                    icon={FileText}
                  />
                ) : (
                  <Table aria-label={t("invoicesTitle")}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("colInvoice")}</TableHead>
                        <TableHead>{t("colCustomer")}</TableHead>
                        <TableHead>{t("colDate")}</TableHead>
                        <TableHead className="text-right">{t("colTotal")}</TableHead>
                        <TableHead className="text-right">{t("colBalance")}</TableHead>
                        <TableHead className="text-right">{t("colPaymentStatus")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => {
                        const paymentKey = paymentLabelKey(invoice.paymentState);
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell>
                              <Link
                                href={`/accounting/invoices/${invoice.id}`}
                                className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {invoice.name ?? invoice.reference ?? `#${invoice.id}`}
                              </Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              #{invoice.contactId}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(invoice.invoiceDate)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(invoice.amountTotal, { currency: DEFAULT_CURRENCY })}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(invoice.amountResidual, { currency: DEFAULT_CURRENCY })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className={toneClass[paymentStateTone(invoice.paymentState)]}
                              >
                                {paymentKey ? t(paymentKey) : invoice.paymentState}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
