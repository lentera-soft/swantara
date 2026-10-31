"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { RowActions } from "@/app/(org)/_components/row-actions";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Contact, SaleQuote } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDate, formatNumber } from "@/lib/utils";
import { humanizeKey } from "@/lib/utils/case";
import { SaleQuoteFormDialog } from "./sale-quote-form-dialog";

function quoteStateVariant(state: SaleQuote["state"]) {
  if (state === "accepted") return "default" as const;
  if (state === "cancelled" || state === "expired") return "outline" as const;
  return "secondary" as const;
}

export function SaleQuotesSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Sales");
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOpportunity = searchParams.get("opportunity");
  const [dialogOpen, setDialogOpen] = useState(Boolean(initialOpportunity));
  const [prefillOpportunity, setPrefillOpportunity] = useState<string | null>(initialOpportunity);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  useEffect(() => {
    setPrefillOpportunity(initialOpportunity);
    if (initialOpportunity) {
      setEditingQuoteId(null);
      setDialogOpen(true);
    }
  }, [initialOpportunity]);

  const quotesQuery = useOrgListQuery<{ quotes: SaleQuote[] }, Record<string, never>>(
    "saleQuotes",
    (organizationId) => getSwantaraService().saleQuotes.list(organizationId),
  );
  const contactsQuery = useOrgListQuery<{ contacts: Contact[] }, Record<string, never>>(
    "contacts",
    (organizationId) => getSwantaraService().contacts.list(organizationId),
  );

  const quotes = quotesQuery.data?.quotes ?? [];
  const contacts = contactsQuery.data?.contacts ?? [];
  const contactMap = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact.displayName || contact.name])),
    [contacts],
  );

  function stateLabel(state: SaleQuote["state"]): string {
    try {
      return (t as unknown as (k: string) => string)(`quoteState.${state}`);
    } catch {
      return humanizeKey(String(state));
    }
  }

  const columns: ColumnDef<SaleQuote>[] = [
    {
      accessorKey: "name",
      header: t("tableQuote"),
      cell: ({ row }) => (
        <a
          href={`/sale-quotes/${row.original.id}`}
          className="rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {row.original.name ?? `SQ-${row.original.id}`}
        </a>
      ),
    },
    {
      accessorKey: "contactId",
      header: t("tableCustomer"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {contactMap.get(row.original.contactId) ?? `#${row.original.contactId}`}
        </span>
      ),
    },
    {
      accessorKey: "version",
      header: t("tableVersion"),
      cell: ({ row }) => <span className="tabular-nums">v{row.original.version}</span>,
    },
    {
      accessorKey: "state",
      header: t("tableStatus"),
      cell: ({ row }) => (
        <Badge variant={quoteStateVariant(row.original.state)}>
          {stateLabel(row.original.state)}
        </Badge>
      ),
    },
    {
      accessorKey: "validityDate",
      header: t("fieldValidityDate"),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.validityDate ? formatDate(row.original.validityDate) : "—"}
        </span>
      ),
    },
    {
      accessorKey: "amountTotal",
      header: t("tableTotal"),
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="tabular-nums">{formatNumber(row.original.amountTotal)}</span>
      ),
    },
    {
      accessorKey: "quoteDate",
      header: t("tableQuoteDate"),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.quoteDate ? formatDate(row.original.quoteDate) : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          editLabel={t("editQuote")}
          deleteLabel={t("deleteQuote")}
          confirmTitle={t("deleteQuoteTitle")}
          confirmDescription={t("deleteQuoteDescription")}
          onEdit={() => {
            if (row.original.state === "draft") {
              setPrefillOpportunity(null);
              setEditingQuoteId(String(row.original.id));
              setDialogOpen(true);
              return;
            }
            router.push(`/sale-quotes/${row.original.id}`);
          }}
          onDelete={() => {
            void getSwantaraService()
              .saleQuotes.delete(Number(orgId), row.original.id)
              .then(() => void quotesQuery.refetch())
              .catch(() => toast.error(t("saveFailed")));
          }}
        />
      ),
    },
  ];

  const isLoading = quotesQuery.isLoading || contactsQuery.isLoading;
  const error = quotesQuery.isError
    ? quotesQuery.error
    : contactsQuery.isError
      ? contactsQuery.error
      : null;

  return (
    <div className="flex flex-col gap-4">
      <InteractiveEntityTable
        columns={columns}
        data={quotes}
        getRowId={(row) => String(row.id)}
        searchKeys={["name"]}
        statusKey="state"
        statusOptions={[
          { value: "draft", label: t("quoteStateDraft") },
          { value: "sent", label: t("quoteStateSent") },
          { value: "accepted", label: t("quoteStateAccepted") },
          { value: "expired", label: t("quoteStateExpired") },
          { value: "cancelled", label: t("quoteStateCancelled") },
        ]}
        searchPlaceholder={t("searchQuotesPlaceholder")}
        filterLabel={t("tableStatus")}
        allLabel={t("allQuotes")}
        ariaLabel={t("allQuotes")}
        emptyTitle={t("emptyQuotes")}
        status={
          isLoading
            ? { type: "loading" }
            : error
              ? {
                  type: "error",
                  message: error.message,
                  onRetry: () => void quotesQuery.refetch(),
                }
              : undefined
        }
        actions={
          <Button
            size="sm"
            onClick={() => {
              setPrefillOpportunity(null);
              setEditingQuoteId(null);
              setDialogOpen(true);
            }}
          >
            <Plus />
            <span>{t("newQuote")}</span>
          </Button>
        }
      />
      {dialogOpen ? (
        <SaleQuoteFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingQuoteId(null);
          }}
          orgId={orgId}
          initialOpportunityId={prefillOpportunity}
          initialQuoteId={editingQuoteId}
          onSave={(quoteId) => {
            setDialogOpen(false);
            setEditingQuoteId(null);
            void quotesQuery.refetch();
            if (!editingQuoteId) router.push(`/sale-quotes/${quoteId}`);
          }}
        />
      ) : null}
    </div>
  );
}
