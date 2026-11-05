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
import type { LegacyColumnDef as ColumnDef, LegacyReactTable } from "@tanstack/react-table/legacy";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Columns3Icon,
  DownloadIcon,
  GripVerticalIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import type { DateRangeValue, FilterValue } from "@/components/filter-bar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";
import { TableFilterBar } from "@/components/table-filter-bar";
import {
  DataTable,
  type DataTableColumnMeta,
  type DataTableDensity,
  type DataTableStatus,
} from "@/components/tanstack-table";
import type { TableFilterConfig } from "@/lib/hooks/use-table-filters";
import { useTableFilters } from "@/lib/hooks/use-table-filters";
import { cn } from "@/lib/utils";
import {
  getColumnId,
  getColumnLabel,
  getColumnValue,
  hasColumnAccessor,
  resolvePath,
} from "@/lib/utils/table";

export type EntityTableStatusOption = {
  value: string;
  label: string;
};

export type EntityTableBulkActionContext<T> = {
  /** Selected rows, in data order. */
  rows: T[];
  clearSelection: () => void;
};

/** What a server-backed table should fetch. `filters` is keyed by column id. */
export type EntityTableQuery = {
  search: string;
  filters: Record<string, FilterValue>;
  sorting: SortingState;
  pageIndex: number;
  pageSize: number;
};

export type EntityTableServerOptions<T> = {
  /** Total rows matching the current query, across all pages. */
  rowCount: number;
  /** Called on mount and whenever search, filters, sort or page change. Fetch and pass the page as `data`. */
  onQueryChange: (query: EntityTableQuery) => void;
  /** Fetches every matching row for "Export". Without it, Export saves the current page. */
  exportRows?: (query: Omit<EntityTableQuery, "pageIndex" | "pageSize">) => Promise<T[]>;
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
  /** Rendered in the selection bar while one or more rows are selected. */
  bulkActions?: (context: EntityTableBulkActionContext<T>) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  exportFileName?: string;
  status?: DataTableStatus;
  enableColumnResizing?: boolean;
  enableRowResizing?: boolean;
  /** Columns hidden until the viewer turns them on, e.g. `{ purchaseUnitId: false }`. */
  initialColumnVisibility?: ColumnVisibilityState;
  /**
   * Storage key for the viewer's column choices (visibility, order, widths, density).
   * Defaults to `exportFileName ?? ariaLabel`; pass `false` to disable.
   */
  persistKey?: string | false;
  /**
   * Mirror search, filters, sort and page into the URL under this prefix, so links
   * can be shared and the back button restores the view. Use a distinct key per table.
   */
  urlStateKey?: string;
  /** Server-side mode: the caller fetches each page; the table does no row processing. */
  server?: EntityTableServerOptions<T>;
  /** Initial row density; the viewer can change it from the Columns panel. */
  density?: DataTableDensity;
  /** Keep the header visible while the body scrolls. Needs `maxHeight`. */
  stickyHeader?: boolean;
  /** Maximum height of the scrolling table area, e.g. `480` or `"60vh"`. */
  maxHeight?: number | string;
  /** Keep the selection column and the first data column visible when scrolling sideways. */
  stickyFirstColumn?: boolean;
};

type Translate = (key: string, values?: Record<string, string | number>) => string;
type ValueGetter<T> = (row: T) => unknown;
type StoredColumns = {
  visibility?: ColumnVisibilityState;
  order?: ColumnOrderState;
  widths?: ColumnSizingState;
  density?: DataTableDensity;
};

type UrlState = {
  search?: string;
  columnFilters?: ColumnFiltersState;
  sorting?: SortingState;
  pageIndex?: number;
  pageSize?: number;
};

const DENSITIES: DataTableDensity[] = ["compact", "normal", "comfortable"];

const STORAGE_PREFIX = "swantara:table-columns:";
const MAX_DERIVED_OPTIONS = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMeta<T extends RowData>(
  column: ColumnDef<T, unknown>,
): DataTableColumnMeta | undefined {
  return column.meta as DataTableColumnMeta | undefined;
}

/** Columns the viewer may hide or reorder: everything except row actions. */
function isManageable<T extends RowData>(column: ColumnDef<T, unknown>): boolean {
  const id = getColumnId(column);
  return id !== "" && id !== "actions" && column.enableHiding !== false;
}

function toText(value: unknown): string {
  if (value == null) {
    return "";
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

function toDate(value: unknown): Date | null {
  if (value == null || value === "") {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? null : date;
}

function matchesDateRange(value: unknown, range: DateRangeValue): boolean {
  const date = toDate(value);
  if (!date || !range?.from) {
    return false;
  }
  const from = new Date(range.from);
  from.setHours(0, 0, 0, 0);
  const to = new Date(range.to ?? range.from);
  to.setHours(23, 59, 59, 999);
  return date >= from && date <= to;
}

function readStoredColumns(key: string | false): StoredColumns | null {
  if (!key) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as StoredColumns) : null;
  } catch {
    return null;
  }
}

function writeStoredColumns(key: string | false, value: StoredColumns | null) {
  if (!key) {
    return;
  }
  try {
    if (value) {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } else {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
    }
  } catch {
    // Storage unavailable (private mode, blocked site data): keep in-memory state only.
  }
}

/** Keeps the stored order for known ids and appends columns added since. */
function reconcileOrder(order: readonly string[], ids: readonly string[]): ColumnOrderState {
  const next = order.filter((id) => ids.includes(id));
  for (const id of ids) {
    if (!next.includes(id)) {
      next.push(id);
    }
  }
  return next;
}

function sameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

function urlParam(key: string, name: string): string {
  return `${key}_${name}`;
}

/** Reads a table's state from the current URL. Date-range filter values become Dates again. */
function readUrlState(key: string | undefined, dateFilterIds: ReadonlySet<string>): UrlState {
  if (!key || typeof window === "undefined") {
    return {};
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const state: UrlState = {};
    const search = params.get(urlParam(key, "q"));
    if (search) {
      state.search = search;
    }
    const rawFilters = params.get(urlParam(key, "f"));
    if (rawFilters) {
      const parsed = JSON.parse(rawFilters) as ColumnFiltersState;
      if (Array.isArray(parsed)) {
        state.columnFilters = parsed.map((f) => {
          if (dateFilterIds.has(f.id) && f.value && typeof f.value === "object") {
            const range = f.value as { from?: string; to?: string };
            return {
              id: f.id,
              value: {
                from: range.from ? new Date(range.from) : undefined,
                to: range.to ? new Date(range.to) : undefined,
              },
            };
          }
          return f;
        });
      }
    }
    const rawSort = params.get(urlParam(key, "s"));
    if (rawSort) {
      state.sorting = rawSort
        .split(",")
        .map((part) => {
          const separator = part.lastIndexOf(":");
          return { id: part.slice(0, separator), desc: part.slice(separator + 1) === "desc" };
        })
        .filter((s) => s.id);
    }
    const page = Number(params.get(urlParam(key, "p")));
    if (Number.isInteger(page) && page > 1) {
      state.pageIndex = page - 1;
    }
    const size = Number(params.get(urlParam(key, "n")));
    if (Number.isInteger(size) && size > 0) {
      state.pageSize = size;
    }
    return state;
  } catch {
    return {};
  }
}

/** Writes a table's state into the URL without a navigation or a re-render. */
function writeUrlState(key: string, state: Required<UrlState>, defaultPageSize: number) {
  const params = new URLSearchParams(window.location.search);
  const set = (name: string, value: string | null) => {
    if (value) {
      params.set(urlParam(key, name), value);
    } else {
      params.delete(urlParam(key, name));
    }
  };
  set("q", state.search.trim() || null);
  set("f", state.columnFilters.length > 0 ? JSON.stringify(state.columnFilters) : null);
  set(
    "s",
    state.sorting.length > 0
      ? state.sorting.map((s) => `${s.id}:${s.desc ? "desc" : "asc"}`).join(",")
      : null,
  );
  set("p", state.pageIndex > 0 ? String(state.pageIndex + 1) : null);
  set("n", state.pageSize !== defaultPageSize ? String(state.pageSize) : null);
  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(window.history.state, "", next);
  }
}

function deriveOptions<T>(data: T[], getValue: ValueGetter<T>): EntityTableStatusOption[] {
  const seen = new Set<string>();
  for (const row of data) {
    const text = toText(getValue(row));
    if (text !== "") {
      seen.add(text);
    }
    if (seen.size > MAX_DERIVED_OPTIONS) {
      break;
    }
  }
  return [...seen]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .slice(0, MAX_DERIVED_OPTIONS)
    .map((value) => ({ value, label: value }));
}

type FilterPlan<T> = {
  config: TableFilterConfig[];
  getters: Map<string, ValueGetter<T>>;
};

function buildFilterPlan<T extends RowData>(options: {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  searchKeys: string[];
  statusKey?: string;
  statusOptions?: EntityTableStatusOption[];
  searchPlaceholder?: string;
  filterLabel?: string;
  allLabel?: string;
  tx: Translate;
}): FilterPlan<T> {
  const {
    columns,
    data,
    searchKeys,
    statusKey,
    statusOptions,
    searchPlaceholder,
    filterLabel,
    allLabel,
    tx,
  } = options;
  const config: TableFilterConfig[] = [];
  const getters = new Map<string, ValueGetter<T>>();

  if (searchKeys.length > 0) {
    config.push({
      id: "search",
      label: tx("search"),
      type: "text",
      placeholder: searchPlaceholder,
    });
  }

  if (statusKey && statusOptions && statusOptions.length > 0) {
    const statusColumn = columns.find(
      (col) =>
        getColumnId(col) === statusKey ||
        (col as { accessorKey?: unknown }).accessorKey === statusKey,
    );
    config.push({
      id: statusKey,
      label: filterLabel || (statusColumn ? getColumnLabel(statusColumn) : statusKey),
      type: "select",
      columnId: statusKey,
      placeholder: allLabel,
      options: statusOptions,
    });
    getters.set(statusKey, (row) => resolvePath(row, statusKey));
  }

  for (const col of columns) {
    const colId = getColumnId(col);
    const meta = getMeta(col);
    if (
      !colId ||
      colId === "actions" ||
      colId === "search" ||
      colId === statusKey ||
      !hasColumnAccessor(col) ||
      meta?.filter === false ||
      searchKeys.includes(colId)
    ) {
      continue;
    }

    const label = getColumnLabel(col) || colId;
    const getValue: ValueGetter<T> = (row) => getColumnValue(col, row);
    const filter = meta?.filter ?? { type: "text" as const };
    getters.set(colId, getValue);

    if (filter.type === "select") {
      const selectOptions = filter.options ?? deriveOptions(data, getValue);
      if (selectOptions.length > 0) {
        config.push({
          id: colId,
          label,
          type: "select",
          columnId: colId,
          options: selectOptions,
          placeholder: filter.placeholder,
        });
      }
    } else if (filter.type === "date-range") {
      config.push({
        id: colId,
        label,
        type: "date-range",
        columnId: colId,
        placeholder: filter.placeholder,
      });
    } else {
      config.push({
        id: colId,
        label,
        type: "text",
        columnId: colId,
        placeholder: filter.placeholder ?? tx("filterBy", { label: label.toLowerCase() }),
      });
    }
  }

  return { config, getters };
}

// ---------------------------------------------------------------------------
// Column manager
// ---------------------------------------------------------------------------

type ColumnManagerLabels = {
  columns: string;
  reset: string;
  density: string;
  densityOptions: Record<DataTableDensity, string>;
  moveUp: (label: string) => string;
  moveDown: (label: string) => string;
};

type ColumnManagerProps = {
  items: { id: string; label: string }[];
  columnVisibility: ColumnVisibilityState;
  labels: ColumnManagerLabels;
  canReset: boolean;
  density: DataTableDensity;
  onDensityChange: (density: DataTableDensity) => void;
  onToggle: (id: string, visible: boolean) => void;
  onMove: (id: string, delta: number) => void;
  onReorder: (fromId: string, toId: string) => void;
  onReset: () => void;
};

function ColumnManager({
  items,
  columnVisibility,
  labels,
  canReset,
  density,
  onDensityChange,
  onToggle,
  onMove,
  onReorder,
  onReset,
}: ColumnManagerProps) {
  const dragIdRef = useRef<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const visibleCount = items.filter((item) => columnVisibility[item.id] !== false).length;

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
          <Button variant="ghost" size="xs" onClick={onReset} disabled={!canReset}>
            <RotateCcwIcon aria-hidden />
            <span>{labels.reset}</span>
          </Button>
        </div>
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">{labels.density}</legend>
          <span aria-hidden className="text-xs text-muted-foreground">
            {labels.density}
          </span>
          <div className="flex flex-1 rounded-md border border-border p-0.5">
            {DENSITIES.map((value) => (
              <Button
                key={value}
                variant={density === value ? "secondary" : "ghost"}
                size="xs"
                className="flex-1"
                aria-pressed={density === value}
                onClick={() => onDensityChange(value)}
              >
                {labels.densityOptions[value]}
              </Button>
            ))}
          </div>
        </fieldset>
        <ul className="flex flex-col gap-0.5">
          {items.map((item, index) => {
            const visible = columnVisibility[item.id] !== false;
            return (
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
                  checked={visible}
                  // Keep at least one data column on screen.
                  disabled={visible && visibleCount <= 1}
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
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

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
  bulkActions,
  emptyTitle,
  emptyDescription,
  exportFileName,
  status: statusOverride,
  enableColumnResizing = true,
  enableRowResizing = false,
  initialColumnVisibility,
  persistKey,
  urlStateKey,
  server,
  density: initialDensity = "normal",
  stickyHeader,
  maxHeight,
  stickyFirstColumn,
}: InteractiveEntityTableProps<T>) {
  const t = useTranslations("Tables");
  const tx = t as unknown as Translate;
  const isServer = server !== undefined;

  // --- Filters ------------------------------------------------------------
  // Callers usually pass inline arrays; key memos on their contents, not identity.
  const searchKeysSignature = searchKeys.join("\u0000");
  const statusOptionsSignature = JSON.stringify(statusOptions);
  const stableSearchKeys = useMemo(
    () => (searchKeysSignature ? searchKeysSignature.split("\u0000") : []),
    [searchKeysSignature],
  );
  const stableStatusOptions = useMemo(
    () => JSON.parse(statusOptionsSignature) as EntityTableStatusOption[],
    [statusOptionsSignature],
  );

  const plan = useMemo(
    () =>
      buildFilterPlan({
        columns,
        data,
        searchKeys: stableSearchKeys,
        statusKey: statusKey as string | undefined,
        statusOptions: stableStatusOptions.length > 0 ? stableStatusOptions : undefined,
        searchPlaceholder,
        filterLabel,
        allLabel,
        tx,
      }),
    [
      columns,
      data,
      stableSearchKeys,
      statusKey,
      stableStatusOptions,
      searchPlaceholder,
      filterLabel,
      allLabel,
      tx,
    ],
  );
  // Options derived from data must not churn filter state on every refetch.
  const configSignature = JSON.stringify(plan.config);
  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute only when the config's content changes
  const filterConfig = useMemo(() => plan.config, [configSignature]);
  const getters = plan.getters;

  // State restored from the URL, read once on mount.
  const [urlState] = useState(() =>
    readUrlState(
      urlStateKey,
      new Set(filterConfig.filter((c) => c.type === "date-range").map((c) => c.columnId ?? c.id)),
    ),
  );

  const filters = useTableFilters(filterConfig, {
    globalFilter: urlState.search,
    columnFilters: urlState.columnFilters,
  });
  const deferredGlobalFilter = useDeferredValue(filters.globalFilter);
  const deferredColumnFilters = useDeferredValue(filters.columnFilters);
  const normalizedQuery = (deferredGlobalFilter ?? "").trim().toLowerCase();

  const filtered = useMemo(() => {
    if (isServer || (normalizedQuery.length === 0 && deferredColumnFilters.length === 0)) {
      return data;
    }
    const typeById = new Map(filterConfig.map((c) => [c.columnId ?? c.id, c.type]));
    return data.filter((row) => {
      if (
        normalizedQuery.length > 0 &&
        !stableSearchKeys.some((key) =>
          toText(resolvePath(row, key)).toLowerCase().includes(normalizedQuery),
        )
      ) {
        return false;
      }
      return deferredColumnFilters.every((f) => {
        const id = String(f.id);
        const value = (getters.get(id) ?? ((r: T) => resolvePath(r, id)))(row);
        const type = typeById.get(id) ?? "text";
        if (type === "select") {
          return toText(value) === String(f.value);
        }
        if (type === "date-range") {
          return matchesDateRange(value, f.value as DateRangeValue);
        }
        return toText(value).toLowerCase().includes(String(f.value).trim().toLowerCase());
      });
    });
  }, [
    isServer,
    data,
    normalizedQuery,
    deferredColumnFilters,
    stableSearchKeys,
    filterConfig,
    getters,
  ]);

  // --- Columns: visibility, order, widths and density, remembered per viewer --
  const storageKey = persistKey === false ? false : (persistKey ?? exportFileName ?? ariaLabel);

  const columnsById = useMemo(() => {
    const map = new Map<string, ColumnDef<T, unknown>>();
    for (const column of columns) {
      if (isManageable(column)) {
        map.set(getColumnId(column), column);
      }
    }
    return map;
  }, [columns]);
  const managedIdsSignature = [...columnsById.keys()].join("\u0000");
  const managedIds = useMemo(
    () => (managedIdsSignature ? managedIdsSignature.split("\u0000") : []),
    [managedIdsSignature],
  );

  const defaultVisibility = useMemo(() => initialColumnVisibility ?? {}, [initialColumnVisibility]);
  const [stored] = useState(() => readStoredColumns(storageKey));
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>(
    () => stored?.visibility ?? defaultVisibility,
  );
  // Only manageable columns are ordered; TanStack appends the rest (e.g. actions) after them.
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() =>
    reconcileOrder(stored?.order ?? managedIds, managedIds),
  );
  const [columnWidths, setColumnWidths] = useState<ColumnSizingState>(() => stored?.widths ?? {});
  const [density, setDensity] = useState<DataTableDensity>(() => stored?.density ?? initialDensity);
  // Bumped on "Reset" so the table re-measures its natural widths.
  const [sizingEpoch, setSizingEpoch] = useState(0);

  useEffect(() => {
    setColumnOrder((prev) => {
      const next = reconcileOrder(prev, managedIds);
      return sameOrder(next, prev) ? prev : next;
    });
  }, [managedIds]);

  const hasCustomWidths = Object.keys(columnWidths).length > 0;
  const isCustomized =
    !sameOrder(columnOrder, managedIds) ||
    hasCustomWidths ||
    density !== initialDensity ||
    managedIds.some((id) => (columnVisibility[id] !== false) !== (defaultVisibility[id] !== false));

  const hasInteracted = useRef(false);
  useEffect(() => {
    if (!hasInteracted.current) {
      return;
    }
    writeStoredColumns(
      storageKey,
      isCustomized
        ? { visibility: columnVisibility, order: columnOrder, widths: columnWidths, density }
        : null,
    );
  }, [storageKey, isCustomized, columnVisibility, columnOrder, columnWidths, density]);

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

  const handleVisibilityChange = useCallback(
    (updater: ColumnVisibilityState | ((old: ColumnVisibilityState) => ColumnVisibilityState)) => {
      hasInteracted.current = true;
      setColumnVisibility(updater);
    },
    [],
  );

  const handleOrderChange = useCallback(
    (updater: ColumnOrderState | ((old: ColumnOrderState) => ColumnOrderState)) => {
      hasInteracted.current = true;
      setColumnOrder(updater);
    },
    [],
  );

  const handleColumnResizeEnd = useCallback((columnId: string, size: number | null) => {
    hasInteracted.current = true;
    setColumnWidths((prev) => {
      if (size == null) {
        if (!(columnId in prev)) {
          return prev;
        }
        const next = { ...prev };
        delete next[columnId];
        return next;
      }
      return prev[columnId] === size ? prev : { ...prev, [columnId]: size };
    });
  }, []);

  const handleDensityChange = useCallback((next: DataTableDensity) => {
    hasInteracted.current = true;
    setDensity(next);
  }, []);

  const handleToggleColumnVisibility = useCallback(
    (id: string, visible: boolean) =>
      handleVisibilityChange((prev) => ({ ...prev, [id]: visible })),
    [handleVisibilityChange],
  );

  const handleMoveColumn = useCallback(
    (id: string, delta: number) =>
      handleOrderChange((prev) => {
        const index = prev.indexOf(id);
        const target = index + delta;
        if (index === -1 || target < 0 || target >= prev.length) {
          return prev;
        }
        const next = [...prev];
        next.splice(index, 1);
        next.splice(target, 0, id);
        return next;
      }),
    [handleOrderChange],
  );

  const handleReorderColumn = useCallback(
    (fromId: string, toId: string) =>
      handleOrderChange((prev) => {
        const from = prev.indexOf(fromId);
        const to = prev.indexOf(toId);
        if (from === -1 || to === -1 || from === to) {
          return prev;
        }
        const next = [...prev];
        next.splice(from, 1);
        next.splice(to, 0, fromId);
        return next;
      }),
    [handleOrderChange],
  );

  const handleResetColumns = useCallback(() => {
    hasInteracted.current = true;
    setColumnOrder(managedIds);
    setColumnVisibility(defaultVisibility);
    setColumnWidths({});
    setDensity(initialDensity);
    setSizingEpoch((epoch) => epoch + 1);
  }, [managedIds, defaultVisibility, initialDensity]);

  // --- Sorting and pagination ---------------------------------------------
  const tableRef = useRef<LegacyReactTable<T> | null>(null);
  const [sorting, setSorting] = useState<SortingState>(() => urlState.sorting ?? []);
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: urlState.pageIndex ?? 0,
    pageSize: urlState.pageSize ?? pageSize,
  }));

  // Go back to page 1 when what is shown changes meaning (search, filters, sort),
  // but not when the same rows arrive again from a refetch or a parent re-render,
  // and not on mount (a page restored from the URL must survive).
  const viewKey = JSON.stringify([normalizedQuery, deferredColumnFilters, sorting]);
  const lastViewKey = useRef(viewKey);
  useEffect(() => {
    if (lastViewKey.current === viewKey) {
      return;
    }
    lastViewKey.current = viewKey;
    setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
  }, [viewKey]);

  // Keep the page in range when rows disappear (deletes, refetch, smaller filter).
  const totalRows = isServer ? server.rowCount : filtered.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pagination.pageSize));
  const isLoading = statusOverride?.type === "loading";
  const effectivePagination =
    !isLoading && pagination.pageIndex > pageCount - 1
      ? { ...pagination, pageIndex: pageCount - 1 }
      : pagination;
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    setPagination(typeof updater === "function" ? updater(effectivePagination) : updater);
  };

  // --- URL state ------------------------------------------------------------
  useEffect(() => {
    if (!urlStateKey) {
      return;
    }
    writeUrlState(
      urlStateKey,
      {
        search: deferredGlobalFilter ?? "",
        columnFilters: deferredColumnFilters,
        sorting,
        pageIndex: effectivePagination.pageIndex,
        pageSize: effectivePagination.pageSize,
      },
      pageSize,
    );
  }, [
    urlStateKey,
    deferredGlobalFilter,
    deferredColumnFilters,
    sorting,
    effectivePagination.pageIndex,
    effectivePagination.pageSize,
    pageSize,
  ]);

  // --- Server mode ------------------------------------------------------------
  const serverQuery = useMemo<Omit<EntityTableQuery, "pageIndex" | "pageSize">>(
    () => ({
      search: (deferredGlobalFilter ?? "").trim(),
      filters: Object.fromEntries(
        deferredColumnFilters.map((f) => [String(f.id), f.value as FilterValue]),
      ),
      sorting,
    }),
    [deferredGlobalFilter, deferredColumnFilters, sorting],
  );
  const onQueryChange = server?.onQueryChange;
  const onQueryChangeRef = useRef(onQueryChange);
  onQueryChangeRef.current = onQueryChange;
  const serverQueryKey = isServer
    ? JSON.stringify([serverQuery, effectivePagination.pageIndex, effectivePagination.pageSize])
    : "";
  // biome-ignore lint/correctness/useExhaustiveDependencies: serverQueryKey captures the query
  useEffect(() => {
    if (!serverQueryKey) {
      return;
    }
    onQueryChangeRef.current?.({
      ...serverQuery,
      pageIndex: effectivePagination.pageIndex,
      pageSize: effectivePagination.pageSize,
    });
  }, [serverQueryKey]);

  // --- Selection ------------------------------------------------------------
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  // In server mode rows on other pages are not in `data`; remember the ones seen.
  const seenRows = useRef(new Map<string, T>());
  if (isServer) {
    data.forEach((row, index) => {
      seenRows.current.set(getRowId(row, index), row);
    });
  }
  const selectedRows = useMemo(() => {
    if (isServer) {
      return Object.keys(rowSelection)
        .filter((id) => rowSelection[id])
        .map((id) => seenRows.current.get(id))
        .filter((row): row is T => row !== undefined);
    }
    return data.filter((row, index) => rowSelection[getRowId(row, index)]);
  }, [isServer, data, rowSelection, getRowId]);
  const clearSelection = useCallback(() => setRowSelection({}), []);

  // Drop selected ids whose rows no longer exist, so every count agrees.
  // (Server mode keeps selections across pages instead.)
  useEffect(() => {
    if (isLoading || isServer) {
      return;
    }
    setRowSelection((prev) => {
      const selectedIds = Object.keys(prev).filter((id) => prev[id]);
      if (selectedIds.length === 0) {
        return prev;
      }
      const existing = new Set(data.map((row, index) => getRowId(row, index)));
      const kept = selectedIds.filter((id) => existing.has(id));
      if (kept.length === selectedIds.length) {
        return prev;
      }
      return Object.fromEntries(kept.map((id) => [id, true]));
    });
  }, [data, getRowId, isLoading, isServer]);

  const selectAllMatching = useCallback(() => {
    const rows = tableRef.current?.getPrePaginatedRowModel().rows;
    if (rows) {
      setRowSelection(Object.fromEntries(rows.map((row) => [row.id, true])));
    }
  }, []);

  // --- Export -----------------------------------------------------------------
  const exportColumns = useMemo(() => {
    const ordered = columnOrder
      .map((id) => columnsById.get(id))
      .filter((col): col is ColumnDef<T, unknown> => col !== undefined);
    const rest = columns.filter((col) => !columnsById.has(getColumnId(col)));
    return [...ordered, ...rest].filter(
      (col) => hasColumnAccessor(col) && columnVisibility[getColumnId(col)] !== false,
    );
  }, [columns, columnsById, columnOrder, columnVisibility]);

  const handleExport = useCallback(
    async (rows: T[]) => {
      const { exportCsv } = await import("@/lib/utils/csv");
      exportCsv(
        exportFileName ?? ariaLabel,
        exportColumns.map((col) => getColumnLabel(col)),
        rows.map((row) => exportColumns.map((col) => getColumnValue(col, row))),
      );
    },
    [exportColumns, exportFileName, ariaLabel],
  );

  const exportRows = server?.exportRows;
  const handleExportAll = useCallback(async () => {
    if (isServer) {
      // All matching rows when the caller can fetch them; otherwise the current page.
      await handleExport(exportRows ? await exportRows(serverQuery) : data);
      return;
    }
    // Export exactly what the table shows: filtered and sorted, all pages.
    await handleExport(
      tableRef.current?.getPrePaginatedRowModel().rows.map((row) => row.original) ?? filtered,
    );
  }, [isServer, exportRows, serverQuery, data, filtered, handleExport]);

  const canSelectAllMatching =
    !isServer && selectedRows.length > 0 && selectedRows.length < filtered.length;

  const selectionBar =
    selectedRows.length > 0 ? (
      <div
        role="toolbar"
        aria-label={tx("selectionActions")}
        className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5"
      >
        <span className="text-sm font-medium tabular-nums" aria-live="polite">
          {tx("rowsSelected", { count: selectedRows.length })}
        </span>
        {canSelectAllMatching ? (
          <Button variant="link" size="sm" onClick={selectAllMatching}>
            {tx("selectAllMatching", { count: filtered.length })}
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" onClick={clearSelection}>
          <XIcon aria-hidden />
          <span>{tx("clearSelection")}</span>
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport(selectedRows)}>
            <DownloadIcon aria-hidden />
            <span>{tx("exportSelected")}</span>
          </Button>
          {bulkActions?.({ rows: selectedRows, clearSelection })}
        </div>
      </div>
    ) : null;

  return (
    <DataTable
      key={sizingEpoch}
      data={filtered}
      columns={columns}
      getRowId={getRowId}
      enableSorting
      enablePagination
      enableRowSelection
      // Rows arrive already filtered; skip TanStack's filter and facet models.
      manualFiltering
      manualSorting={isServer}
      manualPagination={isServer}
      rowCount={isServer ? server.rowCount : undefined}
      pageCount={isServer ? pageCount : undefined}
      enableColumnResizing={enableColumnResizing}
      enableRowResizing={enableRowResizing}
      enableHiding
      sorting={sorting}
      onSortingChange={setSorting}
      pagination={effectivePagination}
      onPaginationChange={handlePaginationChange}
      autoResetPageIndex={false}
      tableRef={tableRef}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={handleVisibilityChange}
      columnOrder={columnOrder}
      onColumnOrderChange={handleOrderChange}
      initialColumnSizing={columnWidths}
      onColumnResizeEnd={handleColumnResizeEnd}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      pageSizeOptions={[8, 16, 32, 64]}
      ariaLabel={ariaLabel}
      density={density}
      stickyHeader={stickyHeader}
      maxHeight={maxHeight}
      stickyFirstColumn={stickyFirstColumn}
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
        <div className="flex w-full min-w-0 flex-col gap-2">
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
                {managerItems.length > 1 ? (
                  <ColumnManager
                    items={managerItems}
                    columnVisibility={columnVisibility}
                    canReset={isCustomized}
                    density={density}
                    onDensityChange={handleDensityChange}
                    labels={{
                      columns: t("columns"),
                      reset: t("resetColumns"),
                      density: t("density"),
                      densityOptions: {
                        compact: t("densityCompact"),
                        normal: t("densityNormal"),
                        comfortable: t("densityComfortable"),
                      },
                      moveUp: (label: string) => t("moveColumnUp", { label }),
                      moveDown: (label: string) => t("moveColumnDown", { label }),
                    }}
                    onToggle={handleToggleColumnVisibility}
                    onMove={handleMoveColumn}
                    onReorder={handleReorderColumn}
                    onReset={handleResetColumns}
                  />
                ) : null}
                <Button variant="outline" size="sm" onClick={handleExportAll}>
                  <DownloadIcon aria-hidden />
                  <span>{t("export")}</span>
                </Button>
                {actions}
              </>
            }
          />
          {selectionBar}
        </div>
      }
    />
  );
}
