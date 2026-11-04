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
import { useMessages, useTranslations } from "next-intl";
import type {
  MouseEvent as ReactMouseEvent,
  ReactNode,
  TouchEvent as ReactTouchEvent,
} from "react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { getColumnLabel } from "@/lib/utils/table";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { EmptyState } from "./empty-state";
import { RouteLoading } from "./route-loading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export type DataTableStatus =
  | { type: "loading"; rows?: number }
  | { type: "error"; message?: string; onRetry?: () => void }
  | { type: "empty"; title?: string; description?: string }
  | { type: "none" };

type PointerPositionEvent = {
  clientX?: number;
  clientY?: number;
  touches?: ArrayLike<{ clientX: number; clientY: number }>;
};

function eventClientX(event: PointerPositionEvent): number {
  if (event.touches && event.touches.length > 0) {
    return event.touches[0]?.clientX ?? 0;
  }
  return event.clientX ?? 0;
}

function eventClientY(event: PointerPositionEvent): number {
  if (event.touches && event.touches.length > 0) {
    return event.touches[0]?.clientY ?? 0;
  }
  return event.clientY ?? 0;
}

const MIN_COLUMN_SIZE = 40;
const MAX_COLUMN_SIZE = 1200;
const MIN_ROW_SIZE = 24;
const MAX_ROW_SIZE = 480;

export type DataTableColumnMeta = {
  align?: "left" | "right" | "center";
  className?: string;
};

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
  status?: DataTableStatus;
  toolbar?: ReactNode;
  ariaLabel?: string;
  className?: string;
  labels?: DataTableLabels;
};

function useDefaultLabels(): Required<DataTableLabels> {
  const raw = useMessages() as unknown as { Tables?: Record<string, string> };
  const messages = raw.Tables ?? {};
  return {
    selectAll: messages.selectAll ?? "",
    selectRow: messages.selectRow ?? "",
    sortBy: messages.sortBy ?? "",
    errorMessage: messages.errorMessage ?? "",
    retry: messages.retry ?? "",
    emptyTitle: messages.emptyTitle ?? "",
    emptyDescription: messages.emptyDescription ?? "",
    rowsSelected: messages.rowsSelected ?? "",
    rowsPerPage: messages.rowsPerPage ?? "",
    page: messages.page ?? "",
    of: messages.of ?? "",
    pagePrevious: messages.pagePrevious ?? "",
    pageNext: messages.pageNext ?? "",
    range: messages.range ?? "",
  };
}

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
  status = { type: "none" },
  toolbar,
  ariaLabel,
  className,
  labels,
}: DataTableProps<TData>) {
  const tAria = useTranslations("Tables" as unknown as "Common");
  const txAria = tAria as unknown as (key: string) => string;
  const resolvedAriaLabel = ariaLabel ?? txAria("ariaLabel");
  const translatedDefaults = useDefaultLabels();
  const t = { ...translatedDefaults, ...labels };
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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const sorting = controlledSorting ?? internalSorting;
  const pagination = controlledPagination ?? internalPagination;
  const columnFilters = controlledColumnFilters ?? internalColumnFilters;
  const globalFilter = controlledGlobalFilter ?? internalGlobalFilter;
  const columnVisibility = controlledVisibility ?? internalVisibility;
  const columnSizing = controlledColumnSizing ?? internalColumnSizing;
  const columnOrder = controlledColumnOrder ?? internalColumnOrder;

  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const [resizingRowId, setResizingRowId] = useState<string | null>(null);
  const [rowSizing, setRowSizing] = useState<Record<string, number>>({});
  const headerElements = useRef(new Map<string, HTMLTableCellElement>());
  const rowElements = useRef(new Map<string, HTMLTableRowElement>());

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
      setRowSelection(next);
      onSelectionChange?.(Object.keys(next));
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

  const firstHeaderGroup = table.getHeaderGroups()[0];
  const sizedHeaders = firstHeaderGroup
    ? firstHeaderGroup.headers.filter((header) => !header.isPlaceholder)
    : [];
  const naturalSizes = useRef<ColumnSizingState>({});
  const useFixedLayout = enableColumnResizing && Object.keys(columnSizing).length > 0;
  const tableMinWidth = useFixedLayout
    ? sizedHeaders.reduce((size, header) => size + header.getSize(), 0) +
      (enableRowSelection ? 40 : 0)
    : undefined;

  useEffect(() => {
    if (!enableColumnResizing || controlledColumnSizing !== undefined) {
      return;
    }
    const measured: ColumnSizingState = {};
    for (const header of sizedHeaders) {
      const el = headerElements.current.get(header.column.id);
      const width = el ? Math.ceil(el.getBoundingClientRect().width) : 0;
      if (width > 0) {
        measured[header.column.id] = width;
      }
    }
    if (Object.keys(naturalSizes.current).length === 0) {
      naturalSizes.current = { ...measured };
    }
    setInternalColumnSizing((prev) => {
      const next = { ...measured, ...prev };
      const keys = Object.keys(next);
      if (
        keys.length === Object.keys(prev).length &&
        keys.every((key) => prev[key] === next[key])
      ) {
        return prev;
      }
      return next;
    });
  });

  const sizedHeadersRef = useRef(sizedHeaders);
  sizedHeadersRef.current = sizedHeaders;

  const applyColumnSizing = useCallback(
    (fn: (prev: ColumnSizingState) => ColumnSizingState) => {
      if (controlledColumnSizing === undefined) {
        setInternalColumnSizing(fn);
      } else {
        onColumnSizingChange?.(fn(controlledColumnSizing));
      }
    },
    [controlledColumnSizing, onColumnSizingChange],
  );

  const beginColumnResize = useCallback(
    (
      columnId: string,
      fallbackSize: number,
      minSize: number,
      maxSize: number,
      event: ReactMouseEvent<HTMLSpanElement> | ReactTouchEvent<HTMLSpanElement>,
    ) => {
      event.preventDefault();
      const startX = eventClientX(event);
      const measured = headerElements.current.get(columnId)?.getBoundingClientRect().width ?? 0;
      const startSize = Math.max(
        minSize,
        columnSizing[columnId] ?? (measured > 0 ? Math.ceil(measured) : fallbackSize),
      );
      setResizingColumnId(columnId);

      const onMove = (moveEvent: MouseEvent | TouchEvent) => {
        if ("touches" in moveEvent && moveEvent.cancelable) {
          moveEvent.preventDefault();
        }
        const next = Math.round(
          Math.min(maxSize, Math.max(minSize, startSize + (eventClientX(moveEvent) - startX))),
        );
        applyColumnSizing((prev) => {
          // Seed unmeasured columns with their real on-screen widths so only
          // the dragged column changes size while the others keep theirs.
          let base = prev;
          for (const header of sizedHeadersRef.current) {
            const id = header.column.id;
            if (base[id] == null) {
              const rect = headerElements.current.get(id)?.getBoundingClientRect().width ?? 0;
              if (rect > 0) {
                base = { ...base, [id]: Math.ceil(rect) };
              }
            }
          }
          if (base[columnId] === next) {
            return base === prev ? prev : base;
          }
          return { ...base, [columnId]: next };
        });
      };
      const stop = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", stop);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", stop);
        document.removeEventListener("touchcancel", stop);
        setResizingColumnId(null);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", stop);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", stop);
      document.addEventListener("touchcancel", stop);
    },
    [applyColumnSizing, columnSizing],
  );

  const beginRowResize = useCallback(
    (rowId: string, event: ReactMouseEvent<HTMLSpanElement> | ReactTouchEvent<HTMLSpanElement>) => {
      event.preventDefault();
      const startY = eventClientY(event);
      const measured = rowElements.current.get(rowId)?.getBoundingClientRect().height ?? 0;
      const startSize = Math.max(
        MIN_ROW_SIZE,
        rowSizing[rowId] ?? (measured > 0 ? Math.ceil(measured) : MIN_ROW_SIZE),
      );
      setResizingRowId(rowId);

      const onMove = (moveEvent: MouseEvent | TouchEvent) => {
        if ("touches" in moveEvent && moveEvent.cancelable) {
          moveEvent.preventDefault();
        }
        const next = Math.round(
          Math.min(
            MAX_ROW_SIZE,
            Math.max(MIN_ROW_SIZE, startSize + (eventClientY(moveEvent) - startY)),
          ),
        );
        setRowSizing((prev) => (prev[rowId] === next ? prev : { ...prev, [rowId]: next }));
      };
      const stop = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", stop);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", stop);
        document.removeEventListener("touchcancel", stop);
        setResizingRowId(null);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", stop);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", stop);
      document.addEventListener("touchcancel", stop);
    },
    [rowSizing],
  );

  const columnSpan = table.getVisibleLeafColumns().length + (enableRowSelection ? 1 : 0);
  const selectedCount = table.getIsSomeRowsSelected() ? Object.keys(rowSelection).length : 0;

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
    rangeLabel = format(t.range, {
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
    return <div data-slot="data-table" className={cn("space-y-2", className)} />;
  }

  return (
    <div data-slot="data-table" className={cn("space-y-2", className)}>
      {toolbar ? <div className="flex items-center gap-2">{toolbar}</div> : null}

      <div className="overflow-hidden rounded-xl border border-border">
        <Table
          aria-label={resolvedAriaLabel}
          className={cn(useFixedLayout && "table-fixed")}
          style={
            tableMinWidth != null ? { width: tableMinWidth, minWidth: tableMinWidth } : undefined
          }
        >
          {useFixedLayout ? (
            <colgroup>
              {enableRowSelection ? <col style={{ width: 40 }} /> : null}
              {sizedHeaders.map((header) => (
                <col key={header.id} style={{ width: header.getSize() }} />
              ))}
            </colgroup>
          ) : null}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {enableRowSelection ? (
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label={t.selectAll}
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
                  const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined;
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
                      )}
                      aria-sort={
                        sort === "asc" ? "ascending" : sort === "desc" ? "descending" : undefined
                      }
                    >
                      {header.column.getCanSort() && enableSorting ? (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="-ml-1 px-1.5 "
                          aria-label={format(t.sortBy, {
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
                        <span
                          aria-hidden
                          data-resizing={resizingColumnId === header.column.id || undefined}
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
                          }}
                          className="absolute inset-y-1 -right-1 z-10 w-2.5 cursor-col-resize touch-none select-none border-r-2 border-r-transparent bg-transparent transition-colors hover:border-r-primary/60 data-[resizing]:border-r-primary"
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
                      {status.message ?? t.errorMessage}
                    </span>
                    {status.onRetry ? (
                      <Button variant="outline" size="sm" onClick={status.onRetry}>
                        {t.retry}
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
                    title={status.type === "empty" ? (status.title ?? t.emptyTitle) : t.emptyTitle}
                    description={status.type === "empty" ? status.description : t.emptyDescription}
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
                      <TableCell>
                        <Checkbox
                          aria-label={format(t.selectRow, { id: row.id })}
                          checked={row.getIsSelected()}
                          onCheckedChange={() => row.toggleSelected()}
                        />
                      </TableCell>
                    ) : null}
                    {row.getVisibleCells().map((cell) => {
                      const cellMeta = cell.column.columnDef.meta as
                        | DataTableColumnMeta
                        | undefined;
                      const content = flexRender(cell.column.columnDef.cell, cell.getContext());
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            alignClass[cellMeta?.align ?? "left"],
                            cellMeta?.className,
                            enableRowResizing && "relative",
                          )}
                        >
                          {rowHeight != null ? (
                            <div className="overflow-hidden" style={{ height: rowHeight }}>
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
            {selectedCount > 0 ? format(t.rowsSelected, { count: selectedCount }) : rangeLabel}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="sr-only">{t.rowsPerPage}</span>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" aria-label={t.rowsPerPage}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} / {t.page}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={t.pagePrevious}
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <ChevronLeftIcon aria-hidden />
              </Button>
              <span className="min-w-16 px-1 text-center text-sm text-muted-foreground">
                {t.page} {table.getState().pagination.pageIndex + 1} {t.of}{" "}
                {manualPagination && pageCount != null
                  ? pageCount
                  : Math.max(table.getPageCount(), 1)}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={t.pageNext}
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
