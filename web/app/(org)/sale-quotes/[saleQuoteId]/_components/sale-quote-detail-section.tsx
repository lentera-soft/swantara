"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";
import { ApprovalWidget } from "@/app/(org)/approval-requests/_components/approval-widget-section";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { DetailPageSkeleton } from "@/components/detail-page-skeleton";
import { RecordLayout } from "@/components/record-layout";
import { StateBadge } from "@/components/state-badge";
import { useOrgListQuery, useOrgQuery } from "@/lib/hooks/use-org-query";
import type {
  ApprovalRequest,
  Contact,
  CrmLead,
  PriceBook,
  SaleQuote,
} from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDate, formatNumber } from "@/lib/utils";
import { humanizeKey } from "@/lib/utils/case";

function getQuoteStatuses(label?: (state: string) => string) {
  const text = (state: string, fallback: string) => (label ? label(state) : fallback);
  return {
    draft: { label: text("draft", "Draft"), tone: "neutral" as const },
    sent: { label: text("sent", "Sent"), tone: "info" as const },
    accepted: { label: text("accepted", "Accepted"), tone: "success" as const },
    expired: { label: text("expired", "Expired"), tone: "warning" as const },
    cancelled: { label: text("cancelled", "Cancelled"), tone: "danger" as const },
  };
}

export function SaleQuoteDetail({ orgId, saleQuoteId }: { orgId: string; saleQuoteId: string }) {
  const t = useTranslations("Sales");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const numericOrgId = Number(orgId);
  const numericQuoteId = Number(saleQuoteId);

  const quoteQuery = useOrgQuery<{ quote: SaleQuote }>("saleQuote", saleQuoteId, (organizationId) =>
    getSwantaraService().saleQuotes.get(organizationId, numericQuoteId),
  );
  const historyQuery = useOrgListQuery<{ quotes: SaleQuote[] }, Record<string, never>>(
    "saleQuoteHistory",
    (organizationId) => getSwantaraService().saleQuotes.history(organizationId, numericQuoteId),
  );
  const contactsQuery = useOrgListQuery<{ contacts: Contact[] }, Record<string, never>>(
    "contacts",
    (organizationId) => getSwantaraService().contacts.list(organizationId),
  );
  const priceBooksQuery = useOrgListQuery<{ priceBooks: PriceBook[] }, Record<string, never>>(
    "price_books",
    (organizationId) => getSwantaraService().priceBooks.list(organizationId),
  );
  const opportunitiesQuery = useOrgListQuery<{ opportunities: CrmLead[] }, Record<string, never>>(
    "crmOpportunities",
    (organizationId) => getSwantaraService().crmOpportunities.list(organizationId),
  );
  const approvalsQuery = useOrgListQuery<{ approvalRequests: ApprovalRequest[] }, { size: number }>(
    "approvalRequests",
    (organizationId) => getSwantaraService().approvalRequests.list(organizationId),
    { size: 200 },
  );

  const quote = quoteQuery.data?.quote ?? null;
  const history = historyQuery.data?.quotes ?? [];
  const contacts = contactsQuery.data?.contacts ?? [];
  const priceBooks = priceBooksQuery.data?.priceBooks ?? [];
  const opportunities = opportunitiesQuery.data?.opportunities ?? [];
  const approvalRequest =
    approvalsQuery.data?.approvalRequests.find(
      (request) => request.ownerType === "sale_quote" && request.ownerId === numericQuoteId,
    ) ?? null;

  const contactMap = useMemo(
    () => new Map(contacts.map((c) => [c.id, c.displayName || c.name])),
    [contacts],
  );
  const priceBookMap = useMemo(() => new Map(priceBooks.map((p) => [p.id, p.name])), [priceBooks]);
  const opportunityMap = useMemo(
    () => new Map(opportunities.map((o) => [o.id, o.name])),
    [opportunities],
  );

  function refresh() {
    void quoteQuery.refetch();
    void historyQuery.refetch();
  }

  function showActionError(error: unknown, failure: string) {
    const message = error instanceof Error && error.message ? error.message : failure;
    const approvalRelated = /approval/i.test(message);
    toast.error(message, {
      action: approvalRelated
        ? {
            label: t("viewApproval"),
            onClick: () =>
              document
                .querySelector('[data-slot="approval-widget"]')
                ?.scrollIntoView({ behavior: "smooth", block: "center" }),
          }
        : undefined,
    });
  }

  function runAction(action: () => Promise<unknown>, success: string, failure: string) {
    void action()
      .then(() => {
        toast.success(success);
        refresh();
        void approvalsQuery.refetch();
      })
      .catch((error) => showActionError(error, failure));
  }

  function revise() {
    void getSwantaraService()
      .saleQuotes.revise(numericOrgId, quote?.id ?? numericQuoteId, {})
      .then(({ quote: revised }) => {
        toast.success(t("quoteRevised"));
        router.push(`/sale-quotes/${revised.id}`);
      })
      .catch(() => toast.error(t("quoteReviseFailed")));
  }

  function stateLabel(state: string): string {
    try {
      return (t as unknown as (k: string) => string)(`quoteState.${state}`);
    } catch {
      return humanizeKey(state);
    }
  }

  if (quoteQuery.isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!quote) {
    return <p className="text-sm text-muted-foreground">{t("quoteNotFound")}</p>;
  }

  const current = quote.isCurrent ? quote : (history.find((item) => item.isCurrent) ?? quote);
  const lines = quote.lines ?? [];

  const overview = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {quote.isCurrent && quote.state === "draft" ? (
          <Button
            size="sm"
            onClick={() =>
              runAction(
                () => getSwantaraService().saleQuotes.send(numericOrgId, quote.id),
                t("quoteSent"),
                t("quoteSendFailed"),
              )
            }
          >
            {t("actionSend")}
          </Button>
        ) : null}
        {quote.isCurrent && quote.state === "sent" ? (
          <Button
            size="sm"
            onClick={() =>
              runAction(
                () => getSwantaraService().saleQuotes.accept(numericOrgId, quote.id),
                t("quoteAccepted"),
                t("quoteAcceptFailed"),
              )
            }
          >
            {t("actionAccept")}
          </Button>
        ) : null}
        {quote.isCurrent && (quote.state === "draft" || quote.state === "sent") ? (
          <>
            <Button size="sm" variant="outline" onClick={revise}>
              {t("actionRevise")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                runAction(
                  () => getSwantaraService().saleQuotes.cancel(numericOrgId, quote.id),
                  t("quoteCancelled"),
                  t("quoteCancelFailed"),
                )
              }
            >
              {tCommon("cancel")}
            </Button>
          </>
        ) : null}
        {quote.isCurrent && quote.state === "sent" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              runAction(
                () => getSwantaraService().saleQuotes.expire(numericOrgId, quote.id),
                t("quoteExpired"),
                t("quoteExpireFailed"),
              )
            }
          >
            {t("actionExpire")}
          </Button>
        ) : null}
        {quote.state === "accepted" && !quote.saleOrderId ? (
          <Button size="sm" asChild>
            <Link href={`/sale-orders?quoteId=${quote.id}`}>{t("convertToOrder")}</Link>
          </Button>
        ) : null}
        {quote.saleOrderId ? (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/sale-orders/${quote.saleOrderId}`}>{t("viewSaleOrder")}</Link>
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{t("quoteLifecycleHint")}</p>
      <ApprovalWidget
        approvalRequest={approvalRequest}
        orgId={orgId}
        onDecided={() => {
          void approvalsQuery.refetch();
          refresh();
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("quoteHeader")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("tableVersion")}</span>
              <span>v{quote.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("tableCustomer")}</span>
              <span>{contactMap.get(quote.contactId) ?? `#${quote.contactId}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("fieldPriceBook")}</span>
              <span>
                {quote.priceBookId
                  ? (priceBookMap.get(quote.priceBookId) ?? `#${quote.priceBookId}`)
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("fieldOpportunity")}</span>
              <span>
                {quote.prospectId
                  ? (opportunityMap.get(quote.prospectId) ?? `#${quote.prospectId}`)
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("tableQuoteDate")}</span>
              <span>{quote.quoteDate ? formatDate(quote.quoteDate) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("fieldValidityDate")}</span>
              <span>{quote.validityDate ? formatDate(quote.validityDate) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("fieldNote")}</span>
              <span>{quote.note || "—"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("tableTotal")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("untaxed")}</span>
              <span className="tabular-nums">{formatNumber(quote.amountUntaxed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("tax")}</span>
              <span className="tabular-nums">{formatNumber(quote.amountTax)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>{t("tableTotal")}</span>
              <span className="tabular-nums">{formatNumber(quote.amountTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("fieldExpectedRevenue")}</span>
              <span className="tabular-nums">
                {quote.expectedRevenue != null ? formatNumber(quote.expectedRevenue) : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("tableStatus")}</span>
              <span>{stateLabel(quote.state)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("acceptedAt")}</span>
              <span>{quote.acceptedAt ? formatDate(quote.acceptedAt) : "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("quoteLines")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-normal">{t("fieldItem")}</th>
                  <th className="py-2 pr-3 text-right font-normal">{t("fieldQty")}</th>
                  <th className="py-2 pr-3 text-right font-normal">{t("unitPrice")}</th>
                  <th className="py-2 pr-3 text-right font-normal">{t("fieldDiscountPct")}</th>
                  <th className="py-2 text-right font-normal">{t("subtotal")}</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      {line.description || (line.itemId ? `#${line.itemId}` : "—")}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{line.qty}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {formatNumber(line.unitPrice)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{line.discountPct}%</td>
                    <td className="py-2 text-right tabular-nums">
                      {formatNumber(line.priceSubtotal)}
                    </td>
                  </tr>
                ))}
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      {t("emptyLines")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const historyTab = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("quoteHistory")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {history.map((item) => (
          <Link
            key={item.id}
            href={`/sale-quotes/${item.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <span className="font-medium">v{item.version}</span>
              <Badge variant={item.isCurrent ? "default" : "outline"}>
                {item.isCurrent ? t("quoteCurrent") : t("quoteSuperseded")}
              </Badge>
              <StateBadge value={item.state} statuses={getQuoteStatuses(stateLabel)} />
            </span>
            <span className="text-muted-foreground">
              {item.quoteDate ? formatDate(item.quoteDate) : "—"} ·{" "}
              <span className="tabular-nums">{formatNumber(item.amountTotal)}</span>
            </span>
          </Link>
        ))}
        {history.length <= 1 ? (
          <p className="text-sm text-muted-foreground">{t("quoteNoHistory")}</p>
        ) : null}
      </CardContent>
    </Card>
  );

  return (
    <RecordLayout
      breadcrumbItems={[
        { label: t("allQuotes"), href: "/sale-quotes" },
        { label: current.name ?? `SQ-${current.id}` },
      ]}
      title={current.name ?? `SQ-${current.id}`}
      status={<StateBadge value={current.state} statuses={getQuoteStatuses(stateLabel)} />}
      tabs={[
        { id: "overview", label: t("tabOverview"), content: overview },
        { id: "history", label: t("quoteHistory"), content: historyTab },
      ]}
    />
  );
}
