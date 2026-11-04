"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { RowActions } from "@/app/(org)/_components/row-actions";
import { Button } from "@/components/button";
import { useOrganizationId } from "@/lib/hooks/use-org-context";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { PaymentTermResponse } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { logger } from "@/lib/utils/client-logger";
import { PAYMENT_TERMS_HREF } from "./payment-term-form";

export type PaymentTermRow = {
  id: string;
  name: string;
  note: string;
  lineCount: number;
};

function toPaymentTermRow(term: PaymentTermResponse): PaymentTermRow {
  return {
    id: String(term.id),
    name: term.name,
    note: term.note ?? "",
    lineCount: term.lines?.length ?? 0,
  };
}

export function PaymentTermsSection(_props: { orgId: string }) {
  const t = useTranslations("Reference");
  const router = useRouter();
  const organizationId = useOrganizationId();

  const query = useOrgListQuery<{ paymentTerms: PaymentTermResponse[] }, Record<string, never>>(
    "paymentTerms",
    (orgId) => getSwantaraService().paymentTerms.list(orgId),
  );

  const terms = (query.data?.paymentTerms ?? []).map(toPaymentTermRow);

  const columns: ColumnDef<PaymentTermRow>[] = [
    {
      accessorKey: "name",
      header: t("tableName"),
      cell: ({ row }) => <span className="">{row.original.name}</span>,
    },
    {
      accessorKey: "note",
      header: t("tableNote"),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.note || "—"}</span>,
    },
    {
      accessorKey: "lineCount",
      header: t("schedule"),
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">{row.original.lineCount}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          editLabel={t("actionEdit")}
          deleteLabel={t("actionDelete")}
          confirmTitle={t("deleteTermTitle")}
          confirmDescription={t("deleteTermDescription")}
          onEdit={() => router.push(`${PAYMENT_TERMS_HREF}/${row.original.id}`)}
          onDelete={() =>
            organizationId == null
              ? undefined
              : void getSwantaraService()
                  .paymentTerms.delete(organizationId, Number(row.original.id))
                  .then(() => void query.refetch())
                  .catch((error) => {
                    logger.error("Failed to delete payment term", error);
                    toast.error(t("toastFailedDelete"));
                  })
          }
        />
      ),
    },
  ];

  return (
    <InteractiveEntityTable
      columns={columns}
      data={terms}
      getRowId={(row) => row.id}
      searchKeys={["name", "note"]}
      searchPlaceholder={t("searchTermsPlaceholder")}
      filterLabel=""
      statusOptions={[]}
      allLabel=""
      ariaLabel={t("paymentTermsTitle")}
      emptyTitle={t("paymentTermsEmpty")}
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
        <Button size="sm" asChild>
          <Link href={`${PAYMENT_TERMS_HREF}/new`}>
            <Plus />
            <span>{t("addTerm")}</span>
          </Link>
        </Button>
      }
    />
  );
}
