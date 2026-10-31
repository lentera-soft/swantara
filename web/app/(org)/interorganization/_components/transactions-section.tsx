"use client";

import { useQuery } from "@tanstack/react-query";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { ReceiptText, Repeat } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import { usePermissions } from "@/lib/hooks/use-permissions";
import type { InterorganizationTransaction } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatNumber } from "@/lib/utils";
import { MirrorInvoiceDialog } from "./mirror-invoice-dialog";
import { MirrorSaleOrderDialog } from "./mirror-sale-order-dialog";

export function InterorganizationTransactionsSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Interorganization");
  const { has } = usePermissions();
  const [mirrorOrderOpen, setMirrorOrderOpen] = useState(false);
  const [mirrorInvoiceOpen, setMirrorInvoiceOpen] = useState(false);

  const query = useOrgListQuery<
    { interorganizationTransactions: InterorganizationTransaction[] },
    Record<string, never>
  >("interorganizationTransactions", (organizationId) =>
    getSwantaraService().interorganizationTransactions.list(organizationId),
  );

  const organizationsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => getSwantaraService().organizations.list(),
  });

  const transactions = query.data?.interorganizationTransactions ?? [];
  const organizationMap = new Map(
    (organizationsQuery.data?.organizations ?? []).map((organization) => [
      organization.id,
      organization.name,
    ]),
  );

  function typeLabel(type: string): string {
    try {
      return (t as unknown as (key: string) => string)(`type_${type}`);
    } catch {
      return type;
    }
  }

  const columns: ColumnDef<InterorganizationTransaction>[] = [
    {
      accessorKey: "sourceType",
      header: t("colSource"),
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span>{typeLabel(row.original.sourceType)}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.sourceOrganizationId != null
              ? (organizationMap.get(row.original.sourceOrganizationId) ??
                `#${row.original.sourceOrganizationId}`)
              : "—"}
            {row.original.sourceId != null ? ` · #${row.original.sourceId}` : ""}
          </span>
        </span>
      ),
    },
    {
      accessorKey: "mirrorType",
      header: t("colMirror"),
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span>{typeLabel(row.original.mirrorType)}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.mirrorOrganizationId != null
              ? (organizationMap.get(row.original.mirrorOrganizationId) ??
                `#${row.original.mirrorOrganizationId}`)
              : "—"}
            {row.original.mirrorId != null ? ` · #${row.original.mirrorId}` : ""}
          </span>
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: t("colAmount"),
      meta: { align: "right" },
      cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.amount)}</span>,
    },
    {
      accessorKey: "state",
      header: t("colState"),
      cell: ({ row }) => (
        <Badge variant={row.original.state === "done" ? "secondary" : "outline"}>
          {(t as unknown as (key: string) => string)(`state_${row.original.state}`)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <InteractiveEntityTable
        columns={columns}
        data={transactions}
        getRowId={(row) => String(row.id)}
        searchKeys={["sourceType", "mirrorType"]}
        searchPlaceholder={t("searchTransactions")}
        ariaLabel={t("transactionsTitle")}
        emptyTitle={t("emptyTransactions")}
        exportFileName="interorganization-transactions"
        status={
          query.isLoading
            ? { type: "loading" }
            : query.isError
              ? {
                  type: "error",
                  message: query.error.message,
                  onRetry: () => void query.refetch(),
                }
              : undefined
        }
        actions={
          has("interorganization_transaction.create") ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setMirrorOrderOpen(true)}>
                <Repeat />
                <span>{t("mirrorSaleOrder")}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMirrorInvoiceOpen(true)}>
                <ReceiptText />
                <span>{t("mirrorInvoice")}</span>
              </Button>
            </div>
          ) : null
        }
      />

      {mirrorOrderOpen ? (
        <MirrorSaleOrderDialog
          open={mirrorOrderOpen}
          onOpenChange={setMirrorOrderOpen}
          orgId={orgId}
          onSuccess={() => {
            setMirrorOrderOpen(false);
            void query.refetch();
          }}
        />
      ) : null}

      {mirrorInvoiceOpen ? (
        <MirrorInvoiceDialog
          open={mirrorInvoiceOpen}
          onOpenChange={setMirrorInvoiceOpen}
          orgId={orgId}
          onSuccess={() => {
            setMirrorInvoiceOpen(false);
            void query.refetch();
          }}
        />
      ) : null}
    </div>
  );
}
