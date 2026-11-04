"use client";

import type { ColumnOrderState, ColumnVisibilityState, RowData } from "@tanstack/react-table";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Columns3Icon,
  DownloadIcon,
  GripVerticalIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import { TableFilterBar } from "@/components/table-filter-bar";
import { DataTable, type DataTableStatus } from "@/components/tanstack-table";
import type { TableFilterConfig } from "@/lib/hooks/use-table-filters";
import { useTableFilters } from "@/lib/hooks/use-table-filters";
import { cn } from "@/lib/utils";
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
  enableColumnResizing?: boolean;
  enableRowResizing?: boolean;
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

type ColumnManagerLabels = {
  columns: string;
  reset: string;
  moveUp: (label: string) => string;
  moveDown: (label: string) => string;
};

type ColumnManagerProps = {
  items: { id: string; label: string }[];
  columnVisibility: ColumnVisibilityState;
  labels: ColumnManagerLabels;
  onToggle: (id: string, visible: boolean) => void;
  onMove: (id: string, delta: number) => void;
  onReorder: (fromId: string, toId: string) => void;
  onReset: () => void;
};

function ColumnManager({
  items,
  columnVisibility,
  labels,
  onToggle,
  onMove,
  onReorder,
  onReset,
}: ColumnManagerProps) {
  const dragIdRef = useRef<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  function clearDrag() {
    dragIdRef.current = null;
    setDragId(null);
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <Columns3Icon aria-hidden />
        <span>{labels.columns}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{labels.columns}</span>
          <Button variant="ghost" size="xs" onClick={onReset}>
            <RotateCcwIcon aria-hidden />
            <span>{labels.reset}</span>
          </Button>
        </div>
        <ul className="flex flex-col gap-0.5">
          {items.map((item, index) => (
            <li
              key={item.id}
              draggable
              onDragStart={(event) => {
                dragIdRef.current = item.id;
                setDragId(item.id);
                if (event.dataTransfer) {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", item.id);
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (event.dataTransfer) {
                  event.dataTransfer.dropEffect = "move";
                }
                const source = dragIdRef.current;
                if (!source || source === item.id) {
                  return;
                }
                onReorder(source, item.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                clearDrag();
              }}
              onDragEnd={clearDrag}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-muted",
                dragId === item.id && "opacity-50",
              )}
            >
              <GripVerticalIcon
                aria-hidden
                className="size-4 shrink-0 cursor-grab text-muted-foreground"
              />
              <Checkbox
                checked={columnVisibility[item.id] !== false}
                onCheckedChange={(checked) => onToggle(item.id, checked === true)}
                aria-label={item.label}
              />
              <span className="min-w-0 flex-1 truncate text-sm">{item.label}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-7"
                aria-label={labels.moveUp(item.label)}
                disabled={index === 0}
                onClick={() => onMove(item.id, -1)}
              >
                <ChevronUpIcon aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-7"
                aria-label={labels.moveDown(item.label)}
                disabled={index === items.length - 1}
                onClick={() => onMove(item.id, 1)}
              >
                <ChevronDownIcon aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
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
  enableColumnResizing = true,
  enableRowResizing = true,
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

  const columnIds = useMemo(() => {
    const ids: string[] = [];
    for (const column of columns) {
      const id = getColumnId(column);
      if (id) {
        ids.push(id);
      }
    }
    return ids;
  }, [columns]);

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(columnIds);

  useEffect(() => {
    setColumnOrder((prev) => {
      const next = prev.filter((id) => columnIds.includes(id));
      for (const id of columnIds) {
        if (!next.includes(id)) {
          next.push(id);
        }
      }
      return next.length === prev.length && next.every((id, i) => id === prev[i]) ? prev : next;
    });
  }, [columnIds]);

  const managerItems = useMemo(
    () =>
      columnOrder
        .filter((id) => columnsById.has(id))
        .map((id) => ({
          id,
          label: getColumnLabel(columnsById.get(id) as ColumnDef<T, unknown>) || id,
        })),
    [columnOrder, columnsById],
  );

  const orderedColumns = useMemo(() => {
    const ordered: ColumnDef<T, unknown>[] = [];
    const used = new Set<string>();
    for (const id of columnOrder) {
      const column = columnsById.get(id);
      if (column) {
        ordered.push(column);
        used.add(id);
      }
    }
    for (const column of columns) {
      const id = getColumnId(column);
      if (!id || !used.has(id)) {
        ordered.push(column);
      }
    }
    return ordered;
  }, [columns, columnsById, columnOrder]);

  const exportColumns = useMemo(
    () => orderedColumns.filter((column) => columnVisibility[getColumnId(column) ?? ""] !== false),
    [orderedColumns, columnVisibility],
  );

  const handleToggleColumnVisibility = useCallback((id: string, visible: boolean) => {
    setColumnVisibility((prev) => ({ ...prev, [id]: visible }));
  }, []);

  const handleMoveColumn = useCallback((id: string, delta: number) => {
    setColumnOrder((prev) => {
      const index = prev.indexOf(id);
      const target = index + delta;
      if (index === -1 || target < 0 || target >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const moved = next.splice(index, 1)[0];
      if (moved === undefined) {
        return prev;
      }
      next.splice(target, 0, moved);
      return next;
    });
  }, []);

  const handleReorderColumn = useCallback((fromId: string, toId: string) => {
    setColumnOrder((prev) => {
      const from = prev.indexOf(fromId);
      const to = prev.indexOf(toId);
      if (from === -1 || to === -1 || from === to) {
        return prev;
      }
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, fromId);
      return next;
    });
  }, []);

  const handleResetColumns = useCallback(() => {
    setColumnOrder(columnIds);
    setColumnVisibility({});
  }, [columnIds]);

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
    const headers = exportColumns.map((column) => getColumnLabel(column));
    const rows = filtered.map((row) => exportColumns.map((column) => getColumnValue(column, row)));
    exportCsv(exportFileName ?? ariaLabel, headers, rows);
  }, [exportColumns, filtered, exportFileName, ariaLabel]);

  return (
    <DataTable
      data={filtered}
      columns={columns}
      getRowId={getRowId}
      enableSorting
      enablePagination
      enableRowSelection
      enableColumnFilters={filterConfig.some((c) => c.id !== "search")}
      enableColumnResizing={enableColumnResizing}
      enableRowResizing={enableRowResizing}
      enableHiding
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
      columnOrder={columnOrder}
      onColumnOrderChange={setColumnOrder}
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
              <ColumnManager
                items={managerItems}
                columnVisibility={columnVisibility}
                labels={{
                  columns: t("columns"),
                  reset: t("resetColumns"),
                  moveUp: (label: string) => t("moveColumnUp", { label }),
                  moveDown: (label: string) => t("moveColumnDown", { label }),
                }}
                onToggle={handleToggleColumnVisibility}
                onMove={handleMoveColumn}
                onReorder={handleReorderColumn}
                onReset={handleResetColumns}
              />
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
