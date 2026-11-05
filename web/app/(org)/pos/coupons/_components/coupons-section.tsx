"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { RowActions } from "@/app/(org)/_components/row-actions";
import { ActiveBadge } from "@/components/active-badge";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { useActiveOrgCurrency } from "@/lib/hooks/use-org-context";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Coupon } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatDate, formatMoney } from "@/lib/utils";
import { CouponFormDialog } from "./coupon-form-dialog";

export function CouponsSection({ orgId }: { orgId: string }) {
  const t = useTranslations("Pos");
  const orgCurrency = useActiveOrgCurrency();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);

  const query = useOrgListQuery<{ coupons: Coupon[] }, Record<string, never>>(
    "coupons",
    (organizationId) => getSwantaraService().coupons.list(organizationId),
  );
  const coupons = query.data?.coupons ?? [];

  function handleSave() {
    setDialogOpen(false);
    setEditCoupon(null);
    void query.refetch();
  }

  function handleDelete(coupon: Coupon) {
    void getSwantaraService()
      .coupons.delete(Number(orgId), coupon.id)
      .then(() => {
        toast.success(t("couponDeleted"));
        void query.refetch();
      })
      .catch(() => toast.error(t("saveFailed")));
  }

  function discountLabel(coupon: Coupon): string {
    if (coupon.discountType === "percent") {
      return `${coupon.discountValue}%`;
    }
    return formatMoney(coupon.discountValue, { currency: orgCurrency });
  }

  const columns: ColumnDef<Coupon>[] = [
    {
      accessorKey: "code",
      header: t("colCode"),
      cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
    },
    {
      accessorKey: "discountType",
      header: t("colType"),
      cell: ({ row }) => (
        <Badge variant="outline">{t(`discountType_${row.original.discountType}`)}</Badge>
      ),
    },
    {
      accessorKey: "discountValue",
      header: t("colDiscount"),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{discountLabel(row.original)}</span>
      ),
    },
    {
      accessorKey: "usedCount",
      header: t("colUsage"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {row.original.usageLimit != null
            ? `${row.original.usedCount} / ${row.original.usageLimit}`
            : `${row.original.usedCount} / —`}
        </span>
      ),
    },
    {
      accessorKey: "expiryDate",
      header: t("colExpiry"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.expiryDate, { nullFallback: "—" })}
        </span>
      ),
    },
    {
      accessorKey: "active",
      header: t("colActive"),
      cell: ({ row }) => (
        <ActiveBadge active={row.original.active}>
          {row.original.active ? t("couponActive") : t("couponInactive")}
        </ActiveBadge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          editLabel={t("edit")}
          deleteLabel={t("deleteCoupon")}
          confirmTitle={t("deleteCouponTitle")}
          confirmDescription={t("deleteCouponDescription")}
          onEdit={() => {
            setEditCoupon(row.original);
            setDialogOpen(true);
          }}
          onDelete={() => handleDelete(row.original)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <InteractiveEntityTable
        columns={columns}
        data={coupons}
        getRowId={(row) => String(row.id)}
        searchKeys={["code"]}
        searchPlaceholder={t("couponsSearchPlaceholder")}
        ariaLabel={t("couponsTitle")}
        emptyTitle={t("couponsEmpty")}
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
          <Button
            size="sm"
            onClick={() => {
              setEditCoupon(null);
              setDialogOpen(true);
            }}
          >
            <Plus />
            <span>{t("newCoupon")}</span>
          </Button>
        }
      />
      {dialogOpen ? (
        <CouponFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          orgId={orgId}
          initial={editCoupon}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
