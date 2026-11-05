import type { RowData } from "@tanstack/react-table";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";

type ColumnShape = {
  id?: string;
  accessorKey?: unknown;
  accessorFn?: unknown;
  header?: unknown;
  meta?: { label?: string };
};

/**
 * Mirrors how TanStack Table derives a column id: explicit `id`, then
 * `accessorKey` (dots replaced by underscores), then a string header.
 */
export function getColumnId<T extends RowData, V>(column: ColumnDef<T, V>): string {
  const shape = column as ColumnShape;
  if (shape.id) {
    return shape.id;
  }
  if (shape.accessorKey !== undefined) {
    return String(shape.accessorKey).replaceAll(".", "_");
  }
  return typeof shape.header === "string" ? shape.header : "";
}

/** True when the column reads a value from the row (as opposed to e.g. an actions column). */
export function hasColumnAccessor<T extends RowData, V>(column: ColumnDef<T, V>): boolean {
  const shape = column as ColumnShape;
  return shape.accessorKey !== undefined || typeof shape.accessorFn === "function";
}

export function getColumnLabel<T extends RowData, V>(column: ColumnDef<T, V>): string {
  const shape = column as ColumnShape;
  if (shape.meta?.label) {
    return shape.meta.label;
  }
  if (typeof shape.header === "string") {
    return shape.header;
  }
  // Context-free header renderers such as `header: () => t("name")` are safe to call.
  if (typeof shape.header === "function" && shape.header.length === 0) {
    try {
      const rendered = (shape.header as () => unknown)();
      if (typeof rendered === "string" && rendered.length > 0) {
        return rendered;
      }
    } catch {
      // Fall through to the key-based label.
    }
  }
  if ("accessorKey" in column && column.accessorKey) {
    return String(column.accessorKey);
  }
  return column.id ?? "";
}

export function resolvePath(row: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value == null) {
      return undefined;
    }
    return (value as Record<string, unknown>)[key];
  }, row);
}

export function getColumnValue<T extends RowData, V>(column: ColumnDef<T, V>, row: T): unknown {
  if ("accessorFn" in column && column.accessorFn) {
    return column.accessorFn(row, 0);
  }
  if ("accessorKey" in column && column.accessorKey) {
    return resolvePath(row, String(column.accessorKey));
  }
  return undefined;
}
