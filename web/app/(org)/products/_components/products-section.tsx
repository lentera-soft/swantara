"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Item, ItemCategory, Unit } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatNumber } from "@/lib/utils";
import { activeColumn, nameColumn } from "@/lib/utils/table-columns";
import type { StubItemCategory } from "./products-data";

type TFn = (key: string, values?: Record<string, string | number>) => string;

function toProductRow(item: Item): {
  id: string;
  name: string;
  categoryId: string | null;
  type: Item["type"];
  unitId: string | null;
  purchaseUnitId: string | null;
  listPrice: number;
  standardCost: number;
  isPurchasable: boolean;
  isSellable: boolean;
  isManufactured: boolean;
  tracking: Item["tracking"];
  active: boolean;
} {
  return {
    id: String(item.id),
    name: item.name,
    categoryId: item.categoryId != null ? String(item.categoryId) : null,
    type: item.type,
    unitId: item.unitId != null ? String(item.unitId) : null,
    purchaseUnitId: item.purchaseUnitId != null ? String(item.purchaseUnitId) : null,
    listPrice: item.listPrice,
    standardCost: item.standardCost,
    isPurchasable: item.isPurchasable,
    isSellable: item.isSellable,
    isManufactured: item.isManufactured,
    tracking: item.tracking,
    active: item.active,
  };
}

function toCategoryRow(category: ItemCategory): StubItemCategory {
  return {
    id: String(category.id),
    name: category.name,
    parentId: category.parentId != null ? String(category.parentId) : null,
    incomeAccountId: category.incomeAccountId != null ? String(category.incomeAccountId) : null,
    expenseAccountId: category.expenseAccountId != null ? String(category.expenseAccountId) : null,
    stockCostAccountId:
      category.stockCostAccountId != null ? String(category.stockCostAccountId) : null,
    stockInputAccountId:
      category.stockInputAccountId != null ? String(category.stockInputAccountId) : null,
    stockOutputAccountId:
      category.stockOutputAccountId != null ? String(category.stockOutputAccountId) : null,
    cogsAccountId: category.cogsAccountId != null ? String(category.cogsAccountId) : null,
    costMethod: category.costMethod ?? null,
    valuation: category.valuation ?? null,
  };
}

function categoryName(categories: StubItemCategory[], id: string | null): string | undefined {
  return categories.find((category) => category.id === id)?.name;
}

function unitName(units: { id: string; name: string }[], id: string | null): string | undefined {
  return units.find((unit) => unit.id === id)?.name;
}

export function ProductsSection(_props: { orgId: string }) {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Products");

  const productsQuery = useOrgListQuery<{ products: Item[] }, Record<string, never>>(
    "products",
    (organizationId) => getSwantaraService().products.list(organizationId),
  );

  const categoriesQuery = useOrgListQuery<{ categories: ItemCategory[] }, Record<string, never>>(
    "productCategories",
    (organizationId) => getSwantaraService().productCategories.list(organizationId),
  );

  const unitsQuery = useOrgListQuery<{ units: Unit[] }, Record<string, never>>(
    "units",
    (organizationId) => getSwantaraService().units.list(organizationId),
  );

  const products = productsQuery.data?.products ?? [];
  const templates = products.map(toProductRow);
  const categories = (categoriesQuery.data?.categories ?? []).map(toCategoryRow);
  const units = (unitsQuery.data?.units ?? []).map((unit) => ({
    id: String(unit.id),
    name: unit.name,
  }));

  const columns: ColumnDef<ReturnType<typeof toProductRow>>[] = [
    nameColumn<ReturnType<typeof toProductRow>>({
      basePath: "products",
      header: t("fieldName"),
    }),
    {
      accessorKey: "categoryId",
      header: () => t("fieldCategory"),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {categoryName(categories, row.original.categoryId) ?? "—"}
        </Badge>
      ),
    },
    {
      accessorKey: "type",
      header: () => t("fieldType"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {(t as unknown as (k: string) => string)(`productType_${row.original.type}`)}
        </span>
      ),
    },
    {
      accessorKey: "unitId",
      header: () => t("fieldUnit"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{unitName(units, row.original.unitId) ?? "—"}</span>
      ),
    },
    {
      accessorKey: "tracking",
      header: () => t("fieldTracking"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {(t as unknown as (k: string) => string)(`trackingMode_${row.original.tracking}`)}
        </span>
      ),
    },
    {
      accessorKey: "listPrice",
      header: () => t("colListPrice"),
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatNumber(row.original.listPrice)}
        </span>
      ),
    },
    {
      accessorKey: "standardCost",
      header: () => t("colStandardCost"),
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatNumber(row.original.standardCost)}
        </span>
      ),
    },
    {
      id: "salesPurchase",
      accessorFn: (row) =>
        [
          row.isSellable ? t("canBeSold") : null,
          row.isPurchasable ? t("canBePurchased") : null,
          row.isManufactured ? t("isManufactured") : null,
        ]
          .filter(Boolean)
          .join(" "),
      header: () => t("salesPurchase"),
      cell: ({ row }) => {
        const flags = [
          row.original.isSellable ? t("canBeSold") : null,
          row.original.isPurchasable ? t("canBePurchased") : null,
          row.original.isManufactured ? t("isManufactured") : null,
        ].filter((flag): flag is string => Boolean(flag));

        if (flags.length === 0) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {flags.map((flag) => (
              <Badge key={flag} variant="outline">
                {flag}
              </Badge>
            ))}
          </div>
        );
      },
    },
    activeColumn<ReturnType<typeof toProductRow>>({
      header: t("colStatus"),
      activeLabel: t("active"),
      inactiveLabel: t("inactive"),
    }),
  ];

  const isLoading = productsQuery.isLoading || categoriesQuery.isLoading || unitsQuery.isLoading;
  const error = productsQuery.isError
    ? productsQuery.error
    : categoriesQuery.isError
      ? categoriesQuery.error
      : unitsQuery.isError
        ? unitsQuery.error
        : null;

  return (
    <div className="flex flex-col gap-4">
      <InteractiveEntityTable
        columns={columns}
        data={templates}
        getRowId={(row) => row.id}
        searchKeys={["name"]}
        statusKey="active"
        statusOptions={[
          { value: "true", label: t("active") },
          { value: "false", label: t("inactive") },
        ]}
        searchPlaceholder={t("searchProducts")}
        filterLabel={t("filterByStatus")}
        allLabel={t("filterAllStatus")}
        ariaLabel={t("allProducts")}
        emptyTitle={t("productsEmpty")}
        status={
          isLoading
            ? { type: "loading" }
            : error
              ? {
                  type: "error",
                  message: error.message,
                  onRetry: () => {
                    void productsQuery.refetch();
                    void categoriesQuery.refetch();
                    void unitsQuery.refetch();
                  },
                }
              : undefined
        }
        actions={
          <Button size="sm" asChild>
            <Link href="/products/new">
              <Plus />
              <span>{t("addItem")}</span>
            </Link>
          </Button>
        }
      />
    </div>
  );
}
