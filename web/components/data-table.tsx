"use client";

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  OnChangeFn,
  PaginationState,
  RowData,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import {
  type LegacyColumnDef as ColumnDef,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type LegacyReactTable,
  useLegacyTable as useReactTable,
} from "@tanstack/react-table/legacy";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  InboxIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { getColumnLabel } from "@/lib/utils/table";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import {
  MAX_COLUMN_SIZE,
  MIN_COLUMN_SIZE,
  RESIZE_KEYBOARD_STEP,
  RESIZE_KEYBOARD_STEP_LARGE,
  SELECTION_COLUMN_WIDTH,
  useDataTableResizing,
} from "./data-table-resizing";
import { EmptyState } from "./empty-state";
import { RouteLoading } from "./route-loading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export type DataTableStatus =
  | { type: "loading"; rows?: number }
  | { type: "error"; message?: string; onRetry?: () => void }
  | { type: "empty"; title?: string; description?: string }
  | { type: "none" };

export type DataTableColumnFilterMeta =
  | { type: "text"; placeholder?: string }
  | { type: "select"; options?: { value: string; label: string }[]; placeholder?: string }
  | { type: "date-range"; placeholder?: string };

export type DataTableColumnMeta = {
  align?: "left" | "right" | "center";
  className?: string;
  /** Plain-text column name for filters, the column menu and CSV headers. */
  label?: string;
  /**
   * How the column is filtered in tables that build filters from columns.
   * `false` removes the column from the filter panel. A `select` without
   * `options` derives them from the column's distinct values.
   */
  filter?: DataTableColumnFilterMeta | false;
};

declare module "@tanstack/react-table" {
  // Lets callers write `meta: { align, filter, label }` with type checking.
  interface ColumnMeta<TFeatures, TData, TValue> extends DataTableColumnMeta {}
}

export type DataTableDensity = "compact" | "normal" | "comfortable";

export type DataTableLabels = {
  selectAll?: string;
  selectRow?: string;
  sortBy?: string;
  errorMessage?: string;
  retry?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  rowsSelected?: string;
  rowsPerPage?: string;
  page?: string;
  of?: string;
  pagePrevious?: string;
  pageNext?: string;
  range?: string;
  resizeColumn?: string;
};

export type DataTableProps<TData extends RowData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  getRowId: (row: TData, index: number) => string;
  enableRowSelection?: boolean;
  enableSorting?: boolean;
  enablePagination?: boolean;
  enableColumnFilters?: boolean;
  enableGlobalFilter?: boolean;
  enableHiding?: boolean;
  enableColumnResizing?: boolean;
  enableRowResizing?: boolean;
  manualPagination?: boolean;
  /** Return to the first page when `data` changes. Defaults to TanStack's behaviour. */
  autoResetPageIndex?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  rowCount?: number;
  pageCount?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  initialSorting?: SortingState;
  initialColumnFilters?: ColumnFiltersState;
  initialGlobalFilter?: string;
  initialColumnVisibility?: ColumnVisibilityState;
  initialColumnSizing?: ColumnSizingState;
  initialColumnOrder?: ColumnOrderState;
  sorting?: SortingState;
  pagination?: PaginationState;
  columnFilters?: ColumnFiltersState;
  globalFilter?: string;
  columnVisibility?: ColumnVisibilityState;
  columnSizing?: ColumnSizingState;
  columnOrder?: ColumnOrderState;
  onSortingChange?: OnChangeFn<SortingState>;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  onGlobalFilterChange?: OnChangeFn<string>;
  onColumnVisibilityChange?: OnChangeFn<ColumnVisibilityState>;
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
  onSelectionChange?: (selectedKeys: string[]) => void;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  status?: DataTableStatus;
  toolbar?: ReactNode;
  ariaLabel?: string;
  className?: string;
  labels?: DataTableLabels;
  /** Receives the table instance, e.g. to read the sorted rows on export. */
  tableRef?: { current: LegacyReactTable<TData> | null };
  /** Called when the viewer finishes resizing a column; `null` means it was reset. */
  onColumnResizeEnd?: (columnId: string, size: number | null) => void;
  /** Keep the header visible while the body scrolls. Needs `maxHeight`. */
  stickyHeader?: boolean;
  /** Maximum height of the scrolling table area, e.g. `480` or `"60vh"`. */
  maxHeight?: number | string;
  /** Keep the selection column and the first data column visible when scrolling sideways. */
  stickyFirstColumn?: boolean;
  density?: DataTableDensity;
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

const densityCellClass: Record<DataTableDensity, string | undefined> = {
  compact: "py-1",
  normal: undefined,
  comfortable: "py-3.5",
};

/** Opaque backgrounds for sticky cells, matching the row's hover and selected states. */
const stickyCellClass =
  "sticky z-[2] bg-background shadow-[1px_0_0_var(--color-border)] group-hover/row:bg-[color-mix(in_oklab,var(--color-muted)_50%,var(--color-background))] group-data-[state=selected]/row:bg-muted";

const alignClass: Record<NonNullable<DataTableColumnMeta["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

function format(template: string, vars: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return result;
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  enableRowSelection = false,
  enableSorting = false,
  enablePagination = false,
  enableColumnFilters = false,
  enableGlobalFilter = false,
  enableHiding = false,
  enableColumnResizing = false,
  enableRowResizing = false,
  manualPagination = false,
  autoResetPageIndex,
  manualSorting = false,
  manualFiltering = false,
  rowCount,
  pageCount,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  initialSorting,
  initialColumnFilters,
  initialGlobalFilter,
  initialColumnVisibility,
  initialColumnSizing,
  initialColumnOrder,
  sorting: controlledSorting,
  pagination: controlledPagination,
  columnFilters: controlledColumnFilters,
  globalFilter: controlledGlobalFilter,
  columnVisibility: controlledVisibility,
  columnSizing: controlledColumnSizing,
  columnOrder: controlledColumnOrder,
  onSortingChange,
  onPaginationChange,
  onColumnFiltersChange,
  onGlobalFilterChange,
  onColumnVisibilityChange,
  onColumnSizingChange,
  onColumnOrderChange,
  onSelectionChange,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  status = { type: "none" },
  toolbar,
  ariaLabel,
  className,
  labels,
  tableRef,
  onColumnResizeEnd,
  stickyHeader = false,
  maxHeight,
  stickyFirstColumn = false,
  density = "normal",
}: DataTableProps<TData>) {
  const tTables = useTranslations("Tables") as unknown as Translate;
  // `labels` overrides keep their simple `{name}` placeholders; defaults go through next-intl.
  const msg = (key: keyof DataTableLabels, vars?: Record<string, string | number>): string => {
    const override = labels?.[key];
    if (override != null) {
      return vars ? format(override, vars) : override;
    }
    return tTables(key, vars);
  };
  const resolvedAriaLabel = ariaLabel ?? tTables("ariaLabel");
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const [internalSorting, setInternalSorting] = useState<SortingState>(initialSorting ?? []);
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>(
    initialColumnFilters ?? [],
  );
  const [internalGlobalFilter, setInternalGlobalFilter] = useState(initialGlobalFilter ?? "");
  const [internalVisibility, setInternalVisibility] = useState<ColumnVisibilityState>(
    initialColumnVisibility ?? {},
  );
  const [internalColumnSizing, setInternalColumnSizing] = useState<ColumnSizingState>(
    initialColumnSizing ?? {},
  );
  const [internalColumnOrder, setInternalColumnOrder] = useState<ColumnOrderState>(
    initialColumnOrder ?? [],
  );
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});

  const sorting = controlledSorting ?? internalSorting;
  const pagination = controlledPagination ?? internalPagination;
  const columnFilters = controlledColumnFilters ?? internalColumnFilters;
  const globalFilter = controlledGlobalFilter ?? internalGlobalFilter;
  const columnVisibility = controlledVisibility ?? internalVisibility;
  const columnSizing = controlledColumnSizing ?? internalColumnSizing;
  const columnOrder = controlledColumnOrder ?? internalColumnOrder;
  const rowSelection = controlledRowSelection ?? internalRowSelection;

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next =
      typeof updater === "function"
        ? (updater as (old: SortingState) => SortingState)(sorting)
        : updater;
    if (controlledSorting === undefined) {
      setInternalSorting(next);
    }
    onSortingChange?.(next);
  };

  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next =
      typeof updater === "function"
        ? (updater as (old: PaginationState) => PaginationState)(pagination)
        : updater;
    if (controlledPagination === undefined) {
      setInternalPagination(next);
    }
    onPaginationChange?.(next);
  };

  const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const next =
      typeof updater === "function"
        ? (updater as (old: ColumnFiltersState) => ColumnFiltersState)(columnFilters)
        : updater;
    if (controlledColumnFilters === undefined) {
      setInternalColumnFilters(next);
    }
    onColumnFiltersChange?.(next);
  };

  const handleGlobalFilterChange: OnChangeFn<string> = (updater) => {
    const next =
      typeof updater === "function" ? (updater as (old: string) => string)(globalFilter) : updater;
    if (controlledGlobalFilter === undefined) {
      setInternalGlobalFilter(next);
    }
    onGlobalFilterChange?.(next);
  };

  const handleVisibilityChange: OnChangeFn<ColumnVisibilityState> = (updater) => {
    const next =
      typeof updater === "function"
        ? (updater as (old: ColumnVisibilityState) => ColumnVisibilityState)(columnVisibility)
        : updater;
    if (controlledVisibility === undefined) {
      setInternalVisibility(next);
    }
    onColumnVisibilityChange?.(next);
  };

  const handleColumnSizingChange: OnChangeFn<ColumnSizingState> = (updater) => {
    const next =
      typeof updater === "function"
        ? (updater as (old: ColumnSizingState) => ColumnSizingState)(columnSizing)
        : updater;
    if (controlledColumnSizing === undefined) {
      setInternalColumnSizing(next);
    }
    onColumnSizingChange?.(next);
  };

  const handleColumnOrderChange: OnChangeFn<ColumnOrderState> = (updater) => {
    const next =
      typeof updater === "function"
        ? (updater as (old: ColumnOrderState) => ColumnOrderState)(columnOrder)
        : updater;
    if (controlledColumnOrder === undefined) {
      setInternalColumnOrder(next);
    }
    onColumnOrderChange?.(next);
  };

  const enableClientSorting = enableSorting && !manualSorting;
  const enableClientPagination = enablePagination && !manualPagination;
  const enableClientFiltering = (enableColumnFilters || enableGlobalFilter) && !manualFiltering;

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      globalFilter,
      columnVisibility,
      columnSizing,
      columnOrder,
    },
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      if (controlledRowSelection === undefined) {
        setInternalRowSelection(next);
      }
      onRowSelectionChange?.(next);
      onSelectionChange?.(Object.keys(next).filter((key) => next[key]));
    },
    onColumnFiltersChange: handleColumnFiltersChange,
    onGlobalFilterChange: handleGlobalFilterChange,
    onColumnVisibilityChange: handleVisibilityChange,
    onColumnSizingChange: handleColumnSizingChange,
    onColumnOrderChange: handleColumnOrderChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableClientSorting ? getSortedRowModel() : undefined,
    getPaginationRowModel: enableClientPagination ? getPaginationRowModel() : undefined,
    getFilteredRowModel: enableClientFiltering ? getFilteredRowModel() : undefined,
    getFacetedRowModel: enableClientFiltering ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: enableClientFiltering ? getFacetedUniqueValues() : undefined,
    manualPagination,
    autoResetPageIndex,
    manualSorting,
    manualFiltering,
    enableRowSelection,
    enableSorting,
    enableColumnFilters,
    enableGlobalFilter,
    enableHiding,
    enableColumnResizing,
    rowCount,
    pageCount,
    globalFilterFn: "includesString",
  });

  if (tableRef) {
    tableRef.current = table;
  }

  const {
    sizedHeaders,
    useFixedLayout,
    tableMinWidth,
    naturalSizes,
    headerElements,
    rowElements,
    colElements,
    tableElement,
    resizingColumnId,
    resizingRowId,
    rowSizing,
    setRowSizing,
    applyColumnSizing,
    beginColumnResize,
    resizeColumnTo,
    beginRowResize,
  } = useDataTableResizing({
    table,
    isClient,
    columnSizing,
    controlledColumnSizing,
    setInternalColumnSizing,
    onColumnSizingChange,
    onColumnResizeEnd,
    enableColumnResizing,
    enableRowSelection,
  });

  const columnSpan = table.getVisibleLeafColumns().length + (enableRowSelection ? 1 : 0);
  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  const totalRows = manualPagination
    ? (rowCount ?? data.length)
    : table.getFilteredRowModel().rows.length;
  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const hasActiveFilter = columnFilters.length > 0 || (globalFilter?.length ?? 0) > 0;

  let rangeLabel: string | null = null;
  if (enablePagination && totalRows > 0) {
    const { pageIndex, pageSize } = table.getState().pagination;
    const from = pageIndex * pageSize + 1;
    const to = Math.min(from + pageSize - 1, totalRows);
    rangeLabel = msg("range", {
      from,
      to,
      total: totalRows,
    });
  }

  const isEmpty =
    status.type === "empty" ||
    table.getRowModel().rows.length === 0 ||
    (filteredRowCount === 0 && hasActiveFilter && status.type === "none");

  if (!isClient) {
    // Same footprint as the real table, so nothing jumps when it takes over.
    return (
      <div data-slot="data-table" aria-busy className={cn("space-y-2", className)}>
        {toolbar ? <div className="h-11 animate-pulse rounded-md bg-muted" /> : null}
        <div className="overflow-hidden rounded-xl border border-border">
          <RouteLoading variant="table" rows={Math.min(pagination.pageSize, 8)} />
        </div>
      </div>
    );
  }

  const firstDataColumnId = table.getVisibleLeafColumns()[0]?.id;
  const stickyDataLeft = enableRowSelection ? SELECTION_COLUMN_WIDTH : 0;

  return (
    <div data-slot="data-table" className={cn("space-y-2", className)}>
      {toolbar ? <div className="flex items-center gap-2">{toolbar}</div> : null}

      <div className="overflow-hidden rounded-xl border border-border">
        <Table
          ref={tableElement}
          aria-label={resolvedAriaLabel}
          className={cn(useFixedLayout && "table-fixed")}
          containerClassName={cn(maxHeight != null && "overflow-y-auto")}
          containerStyle={maxHeight != null ? { maxHeight } : undefined}
          style={
            tableMinWidth != null ? { width: tableMinWidth, minWidth: tableMinWidth } : undefined
          }
        >
          {useFixedLayout ? (
            <colgroup>
              {enableRowSelection ? <col style={{ width: SELECTION_COLUMN_WIDTH }} /> : null}
              {sizedHeaders.map((header) => (
                <col
                  key={header.id}
                  ref={(el) => {
                    if (el) {
                      colElements.current.set(header.column.id, el);
                    } else {
                      colElements.current.delete(header.column.id);
                    }
                  }}
                  style={{ width: header.getSize() }}
                />
              ))}
            </colgroup>
          ) : null}
          <TableHeader
            className={cn(
              stickyHeader &&
                "sticky top-0 z-[3] bg-background shadow-[0_1px_0_var(--color-border)]",
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {enableRowSelection ? (
                  <TableHead
                    className={cn("w-12 pl-4", stickyFirstColumn && cn(stickyCellClass, "left-0"))}
                  >
                    <Checkbox
                      aria-label={msg("selectAll")}
                      checked={table.getIsAllPageRowsSelected()}
                      indeterminate={table.getIsSomePageRowsSelected()}
                      onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
                    />
                  </TableHead>
                ) : null}
                {headerGroup.headers.map((header) => {
                  if (header.isPlaceholder) {
                    return null;
                  }
                  const meta = header.column.columnDef.meta;
                  const sort = header.column.getIsSorted();
                  const sortIconMap: Record<string, typeof ArrowUpIcon> = {
                    asc: ArrowUpIcon,
                    desc: ArrowDownIcon,
                  };
                  const SortIcon = sortIconMap[sort as string] ?? ChevronsUpDownIcon;

                  const canResize = enableColumnResizing && header.column.getCanResize();

                  return (
                    <TableHead
                      key={header.id}
                      scope="col"
                      ref={(el) => {
                        if (el) {
                          headerElements.current.set(header.column.id, el);
                        } else {
                          headerElements.current.delete(header.column.id);
                        }
                      }}
                      className={cn(
                        alignClass[meta?.align ?? "left"],
                        meta?.className,
                        canResize && "relative",
                        stickyFirstColumn &&
                          header.column.id === firstDataColumnId &&
                          stickyCellClass,
                      )}
                      style={
                        stickyFirstColumn && header.column.id === firstDataColumnId
                          ? { left: stickyDataLeft }
                          : undefined
                      }
                      aria-sort={
                        sort === "asc" ? "ascending" : sort === "desc" ? "descending" : undefined
                      }
                    >
                      {header.column.getCanSort() && enableSorting ? (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="-ml-1 px-1.5 "
                          aria-label={msg("sortBy", {
                            label: getColumnLabel(header.column.columnDef),
                          })}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon className="size-3.5 text-muted-foreground" aria-hidden />
                        </Button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                      {canResize ? (
                        // biome-ignore lint/a11y/useSemanticElements: a focusable "window splitter" separator; <hr> cannot hold focus or a value
                        <span
                          role="separator"
                          tabIndex={0}
                          aria-orientation="vertical"
                          aria-label={msg("resizeColumn", {
                            label: getColumnLabel(header.column.columnDef),
                          })}
                          aria-valuenow={header.getSize()}
                          aria-valuemin={header.column.columnDef.minSize ?? MIN_COLUMN_SIZE}
                          aria-valuemax={header.column.columnDef.maxSize ?? MAX_COLUMN_SIZE}
                          data-resizing={resizingColumnId === header.column.id || undefined}
                          onKeyDown={(event) => {
                            const min = header.column.columnDef.minSize ?? MIN_COLUMN_SIZE;
                            const max = header.column.columnDef.maxSize ?? MAX_COLUMN_SIZE;
                            const step = event.shiftKey
                              ? RESIZE_KEYBOARD_STEP_LARGE
                              : RESIZE_KEYBOARD_STEP;
                            const current = header.getSize();
                            let next: number | null = null;
                            if (event.key === "ArrowLeft") next = current - step;
                            else if (event.key === "ArrowRight") next = current + step;
                            else if (event.key === "Home") next = min;
                            else if (event.key === "End") next = max;
                            if (next == null) {
                              return;
                            }
                            event.preventDefault();
                            resizeColumnTo(header.column.id, Math.min(max, Math.max(min, next)));
                          }}
                          onMouseDown={(event) =>
                            beginColumnResize(
                              header.column.id,
                              header.getSize(),
                              header.column.columnDef.minSize ?? MIN_COLUMN_SIZE,
                              header.column.columnDef.maxSize ?? MAX_COLUMN_SIZE,
                              event,
                            )
                          }
                          onTouchStart={(event) =>
                            beginColumnResize(
                              header.column.id,
                              header.getSize(),
                              header.column.columnDef.minSize ?? MIN_COLUMN_SIZE,
                              header.column.columnDef.maxSize ?? MAX_COLUMN_SIZE,
                              event,
                            )
                          }
                          onDoubleClick={() => {
                            const natural = naturalSizes.current[header.column.id];
                            if (natural) {
                              applyColumnSizing((prev) => ({
                                ...prev,
                                [header.column.id]: natural,
                              }));
                            } else {
                              header.column.resetSize();
                            }
                            onColumnResizeEnd?.(header.column.id, null);
                          }}
                          className="absolute inset-y-0 -right-1 z-10 w-2.5 cursor-col-resize touch-none select-none outline-none after:absolute after:inset-y-2 after:right-1 after:w-px after:bg-border after:transition-all hover:after:w-0.5 hover:after:bg-primary/60 focus-visible:after:w-0.5 focus-visible:after:bg-primary data-[resizing]:after:w-0.5 data-[resizing]:after:bg-primary"
                        />
                      ) : null}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          {status.type === "loading" ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={columnSpan} className="p-0">
                  <RouteLoading variant="table" rows={status.rows ?? 3} />
                </TableCell>
              </TableRow>
            </TableBody>
          ) : null}

          {status.type === "error" ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={columnSpan} className="py-8">
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <TriangleAlertIcon className="size-5 text-destructive" aria-hidden />
                    <span className="text-muted-foreground">
                      {status.message ?? msg("errorMessage")}
                    </span>
                    {status.onRetry ? (
                      <Button variant="outline" size="sm" onClick={status.onRetry}>
                        {msg("retry")}
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : null}

          {isEmpty && status.type !== "loading" && status.type !== "error" ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={columnSpan} className="p-0">
                  <EmptyState
                    icon={InboxIcon}
                    title={
                      status.type === "empty"
                        ? (status.title ?? msg("emptyTitle"))
                        : msg("emptyTitle")
                    }
                    description={
                      status.type === "empty" ? status.description : msg("emptyDescription")
                    }
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          ) : null}

          {status.type === "none" && table.getRowModel().rows.length > 0 && !isEmpty ? (
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const rowHeight = enableRowResizing ? rowSizing[row.id] : undefined;
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    className="group/row"
                    ref={(el) => {
                      if (el) {
                        rowElements.current.set(row.id, el);
                      } else {
                        rowElements.current.delete(row.id);
                      }
                    }}
                    style={rowHeight != null ? { height: rowHeight } : undefined}
                  >
                    {enableRowSelection ? (
                      <TableCell
                        className={cn(
                          "w-12 pl-4",
                          densityCellClass[density],
                          stickyFirstColumn && cn(stickyCellClass, "left-0"),
                        )}
                      >
                        <Checkbox
                          aria-label={msg("selectRow", { id: row.id })}
                          checked={row.getIsSelected()}
                          onCheckedChange={() => row.toggleSelected()}
                        />
                      </TableCell>
                    ) : null}
                    {row.getVisibleCells().map((cell) => {
                      const cellMeta = cell.column.columnDef.meta;
                      const content = flexRender(cell.column.columnDef.cell, cell.getContext());
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            alignClass[cellMeta?.align ?? "left"],
                            densityCellClass[density],
                            cellMeta?.className,
                            enableRowResizing && "relative",
                            stickyFirstColumn &&
                              cell.column.id === firstDataColumnId &&
                              stickyCellClass,
                          )}
                          style={
                            stickyFirstColumn && cell.column.id === firstDataColumnId
                              ? { left: stickyDataLeft }
                              : undefined
                          }
                        >
                          {rowHeight != null ? (
                            <div
                              data-row-clip
                              className="overflow-hidden"
                              style={{ height: rowHeight }}
                            >
                              {content}
                            </div>
                          ) : (
                            content
                          )}
                          {enableRowResizing ? (
                            <span
                              aria-hidden
                              data-resizing={resizingRowId === row.id || undefined}
                              onMouseDown={(event) => beginRowResize(row.id, event)}
                              onTouchStart={(event) => beginRowResize(row.id, event)}
                              onDoubleClick={() =>
                                setRowSizing((prev) => {
                                  if (!(row.id in prev)) {
                                    return prev;
                                  }
                                  const next = { ...prev };
                                  delete next[row.id];
                                  return next;
                                })
                              }
                              className="absolute inset-x-0 bottom-0 z-10 h-2 cursor-row-resize touch-none select-none border-b-2 border-b-transparent transition-colors group-hover/row:border-b-primary/40 hover:border-b-primary/80 data-[resizing]:border-b-primary"
                            />
                          ) : null}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          ) : null}
        </Table>
      </div>

      {enablePagination && status.type !== "loading" ? (
        <footer className="flex flex-col items-center gap-3 pt-1 sm:flex-row sm:justify-between">
          <p
            className="text-sm text-muted-foreground"
            aria-live={selectedCount > 0 ? "polite" : undefined}
          >
            {selectedCount > 0 ? msg("rowsSelected", { count: selectedCount }) : rangeLabel}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="sr-only">{msg("rowsPerPage")}</span>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" aria-label={msg("rowsPerPage")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} / {msg("page")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={msg("pagePrevious")}
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <ChevronLeftIcon aria-hidden />
              </Button>
              <span className="min-w-16 px-1 text-center text-sm text-muted-foreground">
                {msg("page")} {table.getState().pagination.pageIndex + 1} {msg("of")}{" "}
                {manualPagination && pageCount != null
                  ? pageCount
                  : Math.max(table.getPageCount(), 1)}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={msg("pageNext")}
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                <ChevronRightIcon aria-hidden />
              </Button>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
