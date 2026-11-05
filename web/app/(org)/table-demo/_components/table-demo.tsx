"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { CheckCheckIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { InteractiveEntityTable } from "@/app/(org)/_components/interactive-entity-table";
import { RowActions } from "@/app/(org)/_components/row-actions";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import type { DataTableStatus } from "@/components/tanstack-table";
import { formatDate, formatNumber } from "@/lib/utils/formatters";

type OrderState = "draft" | "confirmed" | "done" | "cancelled";

type DemoOrder = {
  id: string;
  number: string;
  customer: string;
  owner: { name: string; team: string };
  channel: string;
  state: OrderState;
  orderDate: string;
  total: number;
  lines: number;
  reference: string;
};

const CUSTOMERS = [
  "Arunika Retail",
  "Bumi Logistik",
  "Cahaya Farma",
  "Delta Konstruksi",
  "Embun Kopi",
  "Fajar Tekstil",
  "Garuda Elektronik",
  "Harmoni Hotel",
  "Indah Kreasi",
  "Jaya Makmur",
];
const OWNERS = [
  { name: "Ayu Lestari", team: "Enterprise" },
  { name: "Bima Pratama", team: "SMB" },
  { name: "Citra Dewi", team: "SMB" },
  { name: "Dimas Saputra", team: "Enterprise" },
];
const CHANNELS = ["Direct", "Marketplace", "Partner", "Website"];
const STATES: OrderState[] = ["draft", "confirmed", "confirmed", "done", "done", "cancelled"];

const STATE_LABEL: Record<OrderState, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  done: "Done",
  cancelled: "Cancelled",
};
const STATE_VARIANT: Record<OrderState, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  confirmed: "secondary",
  done: "default",
  cancelled: "destructive",
};

/** Deterministic pseudo-random generator so the demo data is stable across reloads. */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] as T;
}

function makeOrders(count: number): DemoOrder[] {
  const random = seeded(42);
  const start = new Date(2026, 0, 1).getTime();
  const span = 300 * 24 * 60 * 60 * 1000;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start + Math.floor(random() * span));
    return {
      id: `order-${index + 1}`,
      number: `SO/2026/${String(index + 1).padStart(4, "0")}`,
      customer: pick(CUSTOMERS, random),
      owner: pick(OWNERS, random),
      channel: pick(CHANNELS, random),
      state: pick(STATES, random),
      orderDate: date.toISOString(),
      total: Math.round(random() * 250_000_000) / 100,
      lines: 1 + Math.floor(random() * 12),
      reference: `PO-${Math.floor(random() * 90000) + 10000}`,
    };
  });
}

type DemoMode = "data" | "loading" | "error" | "empty";

export function TableDemo() {
  const [orders, setOrders] = useState(() => makeOrders(73));
  const [mode, setMode] = useState<DemoMode>("data");
  const [log, setLog] = useState<string[]>([]);

  const note = useCallback((message: string) => {
    setLog((prev) => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev].slice(0, 5));
  }, []);

  const columns = useMemo<ColumnDef<DemoOrder, unknown>[]>(
    () => [
      {
        accessorKey: "number",
        header: "Order",
        cell: ({ row }) => <span className="font-medium">{row.original.number}</span>,
      },
      {
        accessorKey: "customer",
        // Function header: the label still shows correctly in filters, the column panel and CSV.
        header: () => "Customer",
      },
      {
        id: "owner",
        accessorFn: (row) => row.owner.name,
        header: "Salesperson",
        meta: { filter: { type: "select" } },
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.owner.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.owner.team}</span>
          </div>
        ),
      },
      {
        accessorKey: "channel",
        header: "Channel",
        // A dropdown filter with options taken from the data.
        meta: { filter: { type: "select" } },
      },
      {
        accessorKey: "state",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={STATE_VARIANT[row.original.state]}>
            {STATE_LABEL[row.original.state]}
          </Badge>
        ),
      },
      {
        accessorKey: "orderDate",
        header: "Order date",
        meta: { filter: { type: "date-range" } },
        cell: ({ row }) => formatDate(row.original.orderDate),
      },
      {
        accessorKey: "lines",
        header: "Lines",
        meta: { align: "right", filter: false },
        cell: ({ row }) => <span className="tabular-nums">{row.original.lines}</span>,
      },
      {
        accessorKey: "total",
        header: "Total",
        meta: { align: "right", filter: false },
        cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.total)}</span>,
      },
      {
        accessorKey: "reference",
        header: "Customer ref.",
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <RowActions
            onEdit={() => note(`Edit ${row.original.number}`)}
            onDelete={() => {
              setOrders((prev) => prev.filter((o) => o.id !== row.original.id));
              note(`Deleted ${row.original.number}`);
            }}
          />
        ),
      },
    ],
    [note],
  );

  const status: DataTableStatus | undefined =
    mode === "loading"
      ? { type: "loading", rows: 5 }
      : mode === "error"
        ? {
            type: "error",
            message: "Simulated network error.",
            onRetry: () => setMode("data"),
          }
        : undefined;

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <p className="font-medium">Things to try</p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Search by order number or salesperson (the salesperson is a nested field).</li>
          <li>
            Open <em>Filters</em>: Status, Salesperson and Channel are dropdowns, Order date is a
            date range, and Lines and Total have no filter.
          </li>
          <li>
            Search, filters, sort and page are mirrored into the URL (<code>orders_*</code>), so
            copy the link or reload and the view comes back.
          </li>
          <li>
            Open <em>Columns</em> to hide, reorder or drag columns and to pick a row density.
            &ldquo;Customer ref.&rdquo; starts hidden. Your choices, including widths, are kept
            after a reload; <em>Reset</em> undoes them.
          </li>
          <li>
            Drag a header&rsquo;s right edge to resize a column, or Tab to it and use the arrow keys
            (Shift for bigger steps, Home/End for min/max). Double-click to reset.
          </li>
          <li>
            The header stays put while the body scrolls, and the checkbox and Order columns stay put
            when you scroll sideways.
          </li>
          <li>
            Sort a column, then <em>Export</em>: the CSV follows the on-screen sort and column
            order.
          </li>
          <li>
            Select a row to see the selection bar: &ldquo;Select all&rdquo; picks every matching row
            across pages, plus bulk actions and &ldquo;Export selected&rdquo;.
          </li>
          <li>Go to the last page and delete its rows: the table steps back a page by itself.</li>
        </ul>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-muted-foreground">Simulate:</span>
          {(["data", "loading", "error", "empty"] as const).map((value) => (
            <Button
              key={value}
              size="xs"
              variant={mode === value ? "default" : "outline"}
              onClick={() => setMode(value)}
            >
              {value}
            </Button>
          ))}
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              setOrders(makeOrders(73));
              note("Data reset");
            }}
          >
            Reset data
          </Button>
        </div>
      </section>

      <InteractiveEntityTable<DemoOrder>
        columns={columns}
        data={mode === "empty" ? [] : orders}
        getRowId={(row) => row.id}
        searchKeys={["number", "owner.name"]}
        searchPlaceholder="Search order number or salesperson…"
        statusKey="state"
        statusOptions={(Object.keys(STATE_LABEL) as OrderState[]).map((value) => ({
          value,
          label: STATE_LABEL[value],
        }))}
        filterLabel="Status"
        allLabel="All statuses"
        ariaLabel="Demo sales orders"
        exportFileName="demo-sales-orders"
        persistKey="table-demo"
        urlStateKey="orders"
        stickyHeader
        maxHeight="70vh"
        stickyFirstColumn
        initialColumnVisibility={{ reference: false }}
        status={status}
        emptyTitle="No orders"
        emptyDescription="Nothing matches. Try clearing the filters or switch back to data mode."
        actions={
          <Button size="sm" onClick={() => note("New order clicked")}>
            <PlusIcon aria-hidden />
            <span>New order</span>
          </Button>
        }
        bulkActions={({ rows, clearSelection }) => (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const ids = new Set(rows.map((r) => r.id));
                setOrders((prev) =>
                  prev.map((o) => (ids.has(o.id) ? { ...o, state: "done" as const } : o)),
                );
                note(`Marked ${rows.length} order(s) done`);
                clearSelection();
              }}
            >
              <CheckCheckIcon aria-hidden />
              <span>Mark done</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                const ids = new Set(rows.map((r) => r.id));
                setOrders((prev) => prev.filter((o) => !ids.has(o.id)));
                note(`Deleted ${rows.length} order(s)`);
                clearSelection();
              }}
            >
              <Trash2Icon aria-hidden />
              <span>Delete</span>
            </Button>
          </>
        )}
      />

      {log.length > 0 ? (
        <section aria-live="polite" className="rounded-xl border border-border p-3 text-xs">
          <p className="mb-1 font-medium">Action log</p>
          <ul className="space-y-0.5 font-mono text-muted-foreground">
            {log.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
