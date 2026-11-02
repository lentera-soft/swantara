"use client";

import type { RowData } from "@tanstack/react-table";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useCallback, useDeferredValue, useMemo } from "react";
import { Button } from "@/components/button";
import { TableFilterBar } from "@/components/table-filter-bar";
import { DataTable, type DataTableStatus } from "@/components/tanstack-table";
import type { TableFilterConfig } from "@/lib/hooks/use-table-filters";
import { useTableFilters } from "@/lib/hooks/use-table-filters";
import { getColumnLabel, getColumnValue, resolvePath } from "@/lib/utils/table";

export type EntityTableStatusOption = {
  value: string;
  label: string;
};

export type InteractiveEntityTableProps<T extends RowData> = {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  getRowId: (row: T, index: number) => string;
  searchKeys: string[];
  statusKey?: keyof T;
  statusOptions?: EntityTableStatusOption[];
  searchPlaceholder?: string;
  filterLabel?: string;
  allLabel?: string;
  ariaLabel: string;
  pageSize?: number;
  actions?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  exportFileName?: string;
  status?: DataTableStatus;
};

function getColumnId<TData extends RowData>(column: ColumnDef<TData, unknown>): string | undefined {
  if ("accessorKey" in column && column.accessorKey) {
    return String(column.accessorKey);
  }
  if ("id" in column && column.id) {
    return column.id;
  }
  return undefined;
}

function buildFilterConfig<TData extends RowData>(
  columns: ColumnDef<TData, unknown>[],
  searchKeys: string[],
  statusKey?: string,
  statusOptions?: EntityTableStatusOption[],
  searchPlaceholder?: string,
  filterLabel?: string,
  allLabel?: string,
  searchLabel?: string,
  filterBy?: (label: string) => string,
): TableFilterConfig[] {
  const config: TableFilterConfig[] = [];

  if (searchKeys.length > 0) {
    config.push({
      id: "search",
      label: searchLabel ?? "Search",
      type: "text",
      placeholder: searchPlaceholder,
    });
  }

  if (statusKey && statusOptions && statusOptions.length > 0) {
    config.push({
      id: statusKey,
      label: filterLabel ?? statusKey,
      type: "select",
      columnId: statusKey,
      placeholder: allLabel,
      options: statusOptions.map((opt) => ({ value: opt.value, label: opt.label })),
    });
  }

  for (const column of columns) {
    const colId = getColumnId(column);
    if (!colId || colId === "actions" || colId === "search" || colId === statusKey) {
      continue;
    }
    if (searchKeys.includes(colId)) {
      continue;
    }
    const label = getColumnLabel(column) || colId;
    config.push({
      id: colId,
      label,
      type: "text",
      columnId: colId,
      placeholder: filterBy ? filterBy(label.toLowerCase()) : `Filter ${label.toLowerCase()}…`,
    });
  }

  return config;
}

export function InteractiveEntityTable<T extends RowData>({
  columns,
  data,
  getRowId,
  searchKeys = [],
  statusKey,
  statusOptions = [],
  searchPlaceholder,
  filterLabel,
  allLabel,
  ariaLabel,
  pageSize = 8,
  actions,
  emptyTitle,
  emptyDescription,
  exportFileName,
  status: statusOverride,
}: InteractiveEntityTableProps<T>) {
  const t = useTranslations("Tables");

  const filterConfig = useMemo(
    () =>
      buildFilterConfig(
        columns,
        searchKeys,
        statusKey as string | undefined,
        statusOptions.length > 0 ? statusOptions : undefined,
        searchPlaceholder,
        filterLabel,
        allLabel,
        t("search"),
        (label: string) => t("filterBy", { label }),
      ),
    [columns, searchKeys, statusKey, statusOptions, searchPlaceholder, filterLabel, allLabel, t],
  );

  const filters = useTableFilters(filterConfig);

  const deferredGlobalFilter = useDeferredValue(filters.globalFilter);
  const deferredColumnFilters = useDeferredValue(filters.columnFilters);

  const normalizedQuery = (deferredGlobalFilter ?? "").trim().toLowerCase();

  const columnsById = useMemo(() => {
    const map = new Map<string, ColumnDef<T, unknown>>();
    for (const column of columns) {
      const id = getColumnId(column);
      if (id) {
        map.set(id, column);
      }
    }
    return map;
  }, [columns]);

  const statusKeyStr = statusKey ? String(statusKey) : undefined;

  const filtered = useMemo(() => {
    const hasQuery = normalizedQuery.length > 0;
    const hasFilters = deferredColumnFilters.length > 0;

    if (!hasQuery && !hasFilters) {
      return data;
    }

    return data.filter((row) => {
      if (hasQuery) {
        const matchesQuery = searchKeys.some((key) => {
          const value = resolvePath(row, key);
          return String(value ?? "")
            .toLowerCase()
            .includes(normalizedQuery);
        });
        if (!matchesQuery) {
          return false;
        }
      }

      return deferredColumnFilters.every((filter) => {
        const filterId = String(filter.id);
        const filterValue = String(filter.value ?? "").toLowerCase();

        if (filterId === statusKeyStr) {
          return String(resolvePath(row, filterId) ?? "") === String(filter.value);
        }

        const column = columnsById.get(filterId);
        const cell = column ? getColumnValue(column, row) : resolvePath(row, filterId);
        return String(cell ?? "")
          .toLowerCase()
          .includes(filterValue);
      });
    });
  }, [data, normalizedQuery, deferredColumnFilters, searchKeys, statusKeyStr, columnsById]);

  const handleExport = useCallback(async () => {
    const { exportCsv } = await import("@/lib/utils/csv");
    const headers = columns.map((column) => getColumnLabel(column));
    const rows = filtered.map((row) => columns.map((column) => getColumnValue(column, row)));
    exportCsv(exportFileName ?? ariaLabel, headers, rows);
  }, [columns, filtered, exportFileName, ariaLabel]);

  return (
    <DataTable
      data={filtered}
      columns={columns}
      getRowId={getRowId}
      enableSorting
      enablePagination
      enableRowSelection
      enableColumnFilters={filterConfig.some((c) => c.id !== "search")}
      pageSizeOptions={[8, 16, 32]}
      initialPageSize={pageSize}
      ariaLabel={ariaLabel}
      status={
        statusOverride ??
        (filtered.length === 0
          ? {
              type: "empty",
              title: emptyTitle ?? t("emptyTitle"),
              description: emptyDescription ?? t("emptyDescription"),
            }
          : { type: "none" })
      }
      toolbar={
        <TableFilterBar
          config={filterConfig}
          columnFilters={filters.columnFilters}
          onColumnFiltersChange={filters.onColumnFiltersChange}
          globalFilter={filters.globalFilter}
          onGlobalFilterChange={filters.onGlobalFilterChange}
          onReset={filters.resetFilters}
          className="w-full"
          actions={
            <>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <DownloadIcon aria-hidden />
                <span>{t("export")}</span>
              </Button>
              {actions}
            </>
          }
        />
      }
    />
  );
}
