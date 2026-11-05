"use client";

import type { ColumnSizingState, RowData } from "@tanstack/react-table";
import type { LegacyReactTable } from "@tanstack/react-table/legacy";
import type {
  Dispatch,
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
  SetStateAction,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";

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

/** Width of the row-selection checkbox column, in px. */
export const SELECTION_COLUMN_WIDTH = 48;
export const MIN_COLUMN_SIZE = 40;
export const MAX_COLUMN_SIZE = 1200;
const MIN_ROW_SIZE = 24;
const MAX_ROW_SIZE = 480;
export const RESIZE_KEYBOARD_STEP = 10;
export const RESIZE_KEYBOARD_STEP_LARGE = 50;

type ResizeEvent = ReactMouseEvent<HTMLSpanElement> | ReactTouchEvent<HTMLSpanElement>;

export type UseDataTableResizingOptions<TData extends RowData> = {
  table: LegacyReactTable<TData>;
  isClient: boolean;
  columnSizing: ColumnSizingState;
  controlledColumnSizing: ColumnSizingState | undefined;
  setInternalColumnSizing: Dispatch<SetStateAction<ColumnSizingState>>;
  onColumnSizingChange?: (next: ColumnSizingState) => void;
  onColumnResizeEnd?: (columnId: string, size: number | null) => void;
  enableColumnResizing: boolean;
  enableRowSelection: boolean;
};

/**
 * Column and row resizing for DataTable. Drags paint straight to the DOM once
 * per animation frame and commit to React state only at the start and end.
 */
export function useDataTableResizing<TData extends RowData>({
  table,
  isClient,
  columnSizing,
  controlledColumnSizing,
  setInternalColumnSizing,
  onColumnSizingChange,
  onColumnResizeEnd,
  enableColumnResizing,
  enableRowSelection,
}: UseDataTableResizingOptions<TData>) {
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const [resizingRowId, setResizingRowId] = useState<string | null>(null);
  const [rowSizing, setRowSizing] = useState<Record<string, number>>({});
  const headerElements = useRef(new Map<string, HTMLTableCellElement>());
  const rowElements = useRef(new Map<string, HTMLTableRowElement>());

  const firstHeaderGroup = table.getHeaderGroups()[0];
  const sizedHeaders = firstHeaderGroup
    ? firstHeaderGroup.headers.filter((header) => !header.isPlaceholder)
    : [];
  const naturalSizes = useRef<ColumnSizingState>({});
  const useFixedLayout = enableColumnResizing && Object.keys(columnSizing).length > 0;
  const tableMinWidth = useFixedLayout
    ? sizedHeaders.reduce((size, header) => size + header.getSize(), 0) +
      (enableRowSelection ? SELECTION_COLUMN_WIDTH : 0)
    : undefined;

  const sizedHeadersRef = useRef(sizedHeaders);
  sizedHeadersRef.current = sizedHeaders;
  const headerIdsKey = sizedHeaders.map((header) => header.column.id).join("\u0000");

  // Measure natural column widths once the headers are on screen. Keyed on the
  // set of columns so it does not force a layout read after every render.
  // biome-ignore lint/correctness/useExhaustiveDependencies: headerIdsKey stands in for sizedHeaders
  useEffect(() => {
    if (!isClient || !enableColumnResizing || controlledColumnSizing !== undefined) {
      return;
    }
    const measured: ColumnSizingState = {};
    for (const header of sizedHeadersRef.current) {
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
  }, [
    isClient,
    enableColumnResizing,
    controlledColumnSizing,
    headerIdsKey,
    setInternalColumnSizing,
  ]);

  const tableElement = useRef<HTMLTableElement | null>(null);
  const colElements = useRef(new Map<string, HTMLTableColElement>());
  // Tears down the active drag (listeners + pending frame); also run on unmount.
  const stopActiveDrag = useRef<(() => void) | null>(null);

  useEffect(() => () => stopActiveDrag.current?.(), []);

  const applyColumnSizing = useCallback(
    (fn: (prev: ColumnSizingState) => ColumnSizingState) => {
      if (controlledColumnSizing === undefined) {
        setInternalColumnSizing(fn);
      } else {
        onColumnSizingChange?.(fn(controlledColumnSizing));
      }
    },
    [controlledColumnSizing, onColumnSizingChange, setInternalColumnSizing],
  );

  /**
   * Tracks a pointer drag. Moves are coalesced to one `onFrame` per animation
   * frame; `onEnd` receives the final pointer position.
   */
  const trackDrag = useCallback(
    (axis: "x" | "y", onFrame: (position: number) => void, onEnd: (position: number) => void) => {
      stopActiveDrag.current?.();
      let position: number | null = null;
      let frame = 0;
      const read = axis === "x" ? eventClientX : eventClientY;

      const onMove = (moveEvent: MouseEvent | TouchEvent) => {
        if ("touches" in moveEvent && moveEvent.cancelable) {
          moveEvent.preventDefault();
        }
        position = read(moveEvent);
        if (frame === 0) {
          frame = requestAnimationFrame(() => {
            frame = 0;
            if (position != null) {
              onFrame(position);
            }
          });
        }
      };
      const teardown = () => {
        if (frame !== 0) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", stop);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", stop);
        document.removeEventListener("touchcancel", stop);
        stopActiveDrag.current = null;
      };
      const stop = (endEvent: MouseEvent | TouchEvent) => {
        teardown();
        // touchend has no touches; fall back to the last move position.
        const end = "touches" in endEvent ? position : read(endEvent);
        onEnd(end ?? position ?? Number.NaN);
      };
      stopActiveDrag.current = teardown;
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", stop);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", stop);
      document.addEventListener("touchcancel", stop);
    },
    [],
  );

  const beginColumnResize = useCallback(
    (
      columnId: string,
      fallbackSize: number,
      minSize: number,
      maxSize: number,
      event: ResizeEvent,
    ) => {
      event.preventDefault();
      const startX = eventClientX(event);
      const measured = headerElements.current.get(columnId)?.getBoundingClientRect().width ?? 0;
      const startSize = Math.max(
        minSize,
        columnSizing[columnId] ?? (measured > 0 ? Math.ceil(measured) : fallbackSize),
      );

      // Seed unmeasured columns with their real on-screen widths so only the
      // dragged column changes size. Committed once, so the fixed layout and
      // <colgroup> exist before the first move.
      const base: ColumnSizingState = { ...columnSizing };
      for (const header of sizedHeadersRef.current) {
        const id = header.column.id;
        if (base[id] == null) {
          const rect = headerElements.current.get(id)?.getBoundingClientRect().width ?? 0;
          if (rect > 0) {
            base[id] = Math.ceil(rect);
          }
        }
      }
      base[columnId] = startSize;
      applyColumnSizing((prev) => ({ ...prev, ...base }));
      setResizingColumnId(columnId);

      const sizeAt = (x: number) =>
        Math.round(Math.min(maxSize, Math.max(minSize, startSize + (x - startX))));

      // During the drag, write widths straight to the DOM: no React render per move.
      const paint = (x: number) => {
        const size = sizeAt(x);
        const col = colElements.current.get(columnId);
        if (col) {
          col.style.width = `${size}px`;
        }
        const tableEl = tableElement.current;
        if (tableEl) {
          let total = enableRowSelection ? SELECTION_COLUMN_WIDTH : 0;
          for (const header of sizedHeadersRef.current) {
            const id = header.column.id;
            total += id === columnId ? size : (base[id] ?? header.getSize());
          }
          tableEl.style.width = `${total}px`;
          tableEl.style.minWidth = `${total}px`;
        }
      };

      trackDrag("x", paint, (x) => {
        const size = Number.isNaN(x) ? startSize : sizeAt(x);
        applyColumnSizing((prev) =>
          prev[columnId] === size ? prev : { ...prev, [columnId]: size },
        );
        setResizingColumnId(null);
        onColumnResizeEnd?.(columnId, size);
      });
    },
    [applyColumnSizing, columnSizing, enableRowSelection, trackDrag, onColumnResizeEnd],
  );

  /** Keyboard resizing: seeds measured widths like a drag, then sets one column. */
  const resizeColumnTo = useCallback(
    (columnId: string, size: number) => {
      applyColumnSizing((prev) => {
        const next: ColumnSizingState = { ...prev };
        for (const header of sizedHeadersRef.current) {
          const id = header.column.id;
          if (next[id] == null) {
            const rect = headerElements.current.get(id)?.getBoundingClientRect().width ?? 0;
            next[id] = rect > 0 ? Math.ceil(rect) : header.getSize();
          }
        }
        next[columnId] = size;
        return next;
      });
      onColumnResizeEnd?.(columnId, size);
    },
    [applyColumnSizing, onColumnResizeEnd],
  );

  const beginRowResize = useCallback(
    (rowId: string, event: ResizeEvent) => {
      event.preventDefault();
      const startY = eventClientY(event);
      const measured = rowElements.current.get(rowId)?.getBoundingClientRect().height ?? 0;
      const startSize = Math.max(
        MIN_ROW_SIZE,
        rowSizing[rowId] ?? (measured > 0 ? Math.ceil(measured) : MIN_ROW_SIZE),
      );
      // Commit the start height once so the row renders its clipping wrappers.
      setRowSizing((prev) => (prev[rowId] === startSize ? prev : { ...prev, [rowId]: startSize }));
      setResizingRowId(rowId);

      const sizeAt = (y: number) =>
        Math.round(Math.min(MAX_ROW_SIZE, Math.max(MIN_ROW_SIZE, startSize + (y - startY))));

      const paint = (y: number) => {
        const rowEl = rowElements.current.get(rowId);
        if (!rowEl) {
          return;
        }
        const height = `${sizeAt(y)}px`;
        rowEl.style.height = height;
        for (const clip of rowEl.querySelectorAll<HTMLElement>("[data-row-clip]")) {
          clip.style.height = height;
        }
      };

      trackDrag("y", paint, (y) => {
        const size = Number.isNaN(y) ? startSize : sizeAt(y);
        setRowSizing((prev) => (prev[rowId] === size ? prev : { ...prev, [rowId]: size }));
        setResizingRowId(null);
      });
    },
    [rowSizing, trackDrag],
  );

  return {
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
  };
}
