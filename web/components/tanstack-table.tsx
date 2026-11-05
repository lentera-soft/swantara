"use client";

import type { RowData } from "@tanstack/react-table";
import { type DataTableProps, DataTable as UiDataTable } from "@/components/data-table";

export type {
  DataTableColumnFilterMeta,
  DataTableColumnMeta,
  DataTableDensity,
  DataTableProps,
  DataTableStatus,
} from "@/components/data-table";

export function DataTable<TData extends RowData>(props: Omit<DataTableProps<TData>, "labels">) {
  return <UiDataTable data-slot="data-table" {...(props as DataTableProps<TData>)} />;
}
