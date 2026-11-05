import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/lib/tests";
import * as exportModule from "@/lib/utils/csv";
import {
  InteractiveEntityTable,
  type InteractiveEntityTableProps,
} from "../interactive-entity-table";

type Row = { id: string; name: string; status: "active" | "inactive" };

const rows: Row[] = [
  { id: "a", name: "Alpha", status: "active" },
  { id: "b", name: "Beta", status: "inactive" },
];

function renderTable(props: Partial<InteractiveEntityTableProps<Row>> = {}) {
  return renderWithProviders(
    <InteractiveEntityTable<Row>
      columns={[
        {
          id: "name",
          accessorKey: "name",
          header: "Nama",
          cell: ({ row }) => row.original.name,
        },
        {
          id: "status",
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => row.original.status,
        },
      ]}
      data={rows}
      getRowId={(row) => row.id}
      searchKeys={["name"]}
      statusKey="status"
      statusOptions={[{ value: "active", label: "Aktif" }]}
      searchPlaceholder="Cari"
      filterLabel="Saring berdasar status"
      allLabel="Semua status"
      ariaLabel="Entities"
      {...props}
    />,
  );
}

function rect(width: number, height: number): DOMRect {
  return {
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

function columnWidths(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll("colgroup col")).map(
    (col) => Number.parseFloat((col as HTMLElement).style.width) || 0,
  );
}

describe("InteractiveEntityTable", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders column resize handles by default", () => {
    const { container } = renderTable();
    expect(container.querySelectorAll(".cursor-col-resize")).toHaveLength(2);
  });

  it("renders no row resize strips unless enabled", () => {
    const { container } = renderTable();
    expect(container.querySelectorAll(".cursor-row-resize")).toHaveLength(0);
  });

  it("renders a row resize strip on every body cell when enabled", () => {
    const { container } = renderTable({ enableRowResizing: true });
    const rows = container.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.querySelectorAll(".cursor-row-resize")).toHaveLength(2);
    }
  });

  it("resizes a column by dragging the resize handle", () => {
    const { container } = renderTable();
    const handle = container.querySelector(".cursor-col-resize") as Element;

    fireEvent.mouseDown(handle, { clientX: 100 });
    expect(handle.hasAttribute("data-resizing")).toBe(true);
    fireEvent.mouseMove(document, { clientX: 200 });
    fireEvent.mouseUp(document, { clientX: 200 });

    const after = columnWidths(container);
    // [selection column, first data column, second data column]
    expect(after).toHaveLength(3);
    expect(after[1]).toBeGreaterThanOrEqual(200);
  });

  it("only resizes the dragged column when layout was unmeasurable at mount", () => {
    let visible = false;
    const spy = vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
      this: Element,
    ) {
      const text = this.textContent ?? "";
      if (visible && this.tagName === "TH" && text.includes("Nama")) return rect(200, 44);
      if (visible && this.tagName === "TH" && text.includes("Status")) return rect(100, 44);
      return rect(0, 0);
    });

    const { container } = renderTable();
    visible = true;

    const handle = container.querySelector(".cursor-col-resize") as Element;
    fireEvent.mouseDown(handle, { clientX: 300 });
    fireEvent.mouseMove(document, { clientX: 250 });
    fireEvent.mouseUp(document, { clientX: 250 });

    // The dragged "name" column shrinks from 200 to 150; "status" keeps its
    // real 100px width instead of jumping to the library default.
    expect(columnWidths(container)).toEqual([48, 150, 100]);
    spy.mockRestore();
  });

  it("renders every resize handle on the column's right edge", () => {
    const { container } = renderTable();
    const handles = container.querySelectorAll(".cursor-col-resize");
    expect(handles).toHaveLength(2);
    for (const handle of handles) {
      expect(handle.className).toContain("-right-1");
      expect(handle.className).not.toContain("left-0");
    }
  });

  it("dragging a column handle changes only that column", () => {
    const { container } = renderTable();
    const handles = container.querySelectorAll(".cursor-col-resize");
    const second = handles[1] as Element;

    fireEvent.mouseDown(second, { clientX: 300 });
    fireEvent.mouseMove(document, { clientX: 400 });
    fireEvent.mouseUp(document, { clientX: 400 });

    const widths = columnWidths(container);
    // The first data column is untouched; only the second one grew.
    expect(widths[1]).toBe(150);
    expect(widths[2]).toBeGreaterThanOrEqual(200);
  });

  it("paints column drags per frame without re-rendering cells, then commits once", () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    let cellRenders = 0;
    const { container } = renderWithProviders(
      <InteractiveEntityTable<Row>
        columns={[
          {
            id: "name",
            accessorKey: "name",
            header: "Nama",
            cell: ({ row }) => {
              cellRenders += 1;
              return row.original.name;
            },
          },
          { id: "status", accessorKey: "status", header: "Status" },
        ]}
        data={rows}
        getRowId={(row) => row.id}
        searchKeys={["name"]}
        ariaLabel="Perf"
        persistKey={false}
      />,
    );
    const handle = container.querySelector(".cursor-col-resize") as Element;

    fireEvent.mouseDown(handle, { clientX: 100 });
    const rendersAfterStart = cellRenders;
    for (let x = 110; x <= 200; x += 10) {
      fireEvent.mouseMove(document, { clientX: x });
    }
    // Ten moves within one frame are coalesced into a single paint.
    expect(frames).toHaveLength(1);
    frames.shift()?.(0);
    expect(cellRenders).toBe(rendersAfterStart);
    expect(columnWidths(container)[1]).toBe(250);

    fireEvent.mouseUp(document, { clientX: 220 });
    expect(columnWidths(container)[1]).toBe(270);
    vi.restoreAllMocks();
  });

  it("resizes a row by dragging the bottom strip", () => {
    const { container } = renderTable({ enableRowResizing: true });
    const strip = container.querySelector(".cursor-row-resize") as Element;

    fireEvent.mouseDown(strip, { clientY: 10 });
    expect(strip.hasAttribute("data-resizing")).toBe(true);
    fireEvent.mouseMove(document, { clientY: 70 });
    fireEvent.mouseUp(document, { clientY: 70 });

    const firstRow = container.querySelector("tbody tr") as HTMLElement;
    expect(Number.parseFloat(firstRow.style.height)).toBeGreaterThanOrEqual(50);
  });

  it("reorders columns by dragging list items in the column manager", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "Kolom" }));
    const items = screen.getAllByRole("listitem");
    const [first, second] = items as [HTMLElement, HTMLElement];
    fireEvent.dragStart(first);
    fireEvent.dragOver(second);
    fireEvent.drop(second);
    fireEvent.dragEnd(first);

    const headers = screen
      .getAllByRole("columnheader")
      .map((header) => header.textContent?.trim())
      .filter((text) => text && text.length > 0);
    expect(headers[0]).toContain("Status");
    expect(headers[1]).toContain("Nama");
  });

  it("hides columns from the column manager", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "Kolom" }));
    await user.click(screen.getByRole("checkbox", { name: "Status" }));

    expect(screen.queryByRole("columnheader", { name: /Status/ })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Nama/ })).toBeInTheDocument();
  });

  it("reorders columns from the column manager", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "Kolom" }));
    await user.click(screen.getByRole("button", { name: "Turunkan kolom Nama" }));

    const headers = screen
      .getAllByRole("columnheader")
      .map((header) => header.textContent?.trim())
      .filter((text) => text && text.length > 0);
    expect(headers[0]).toContain("Status");
    expect(headers[1]).toContain("Nama");
  });

  it("exports only visible columns in the selected order", async () => {
    const user = userEvent.setup();
    const exportSpy = vi.spyOn(exportModule, "exportCsv").mockImplementation(() => {});
    renderTable();

    await user.click(screen.getByRole("button", { name: "Kolom" }));
    await user.click(screen.getByRole("checkbox", { name: "Status" }));
    await user.click(screen.getByRole("button", { name: "Ekspor" }));

    expect(exportSpy).toHaveBeenCalledWith("Entities", ["Nama"], [["Alpha"], ["Beta"]]);
    exportSpy.mockRestore();
  });

  it("exports the filtered rows as CSV", async () => {
    const user = userEvent.setup();
    const exportSpy = vi.spyOn(exportModule, "exportCsv").mockImplementation(() => {});
    renderTable();

    await user.type(screen.getByPlaceholderText("Cari"), "Alpha");
    await user.click(screen.getByRole("button", { name: "Ekspor" }));

    expect(exportSpy).toHaveBeenCalledWith("Entities", ["Nama", "Status"], [["Alpha", "active"]]);
    exportSpy.mockRestore();
  });

  it("exports all rows when no search is applied", async () => {
    const user = userEvent.setup();
    const exportSpy = vi.spyOn(exportModule, "exportCsv").mockImplementation(() => {});
    renderTable();

    await user.click(screen.getByRole("button", { name: "Ekspor" }));

    expect(exportSpy).toHaveBeenCalledWith(
      "Entities",
      ["Nama", "Status"],
      [
        ["Alpha", "active"],
        ["Beta", "inactive"],
      ],
    );
    exportSpy.mockRestore();
  });
});

type RichRow = { id: string; name: string; status: "active" | "inactive"; kind: string };

const richRows: RichRow[] = [
  { id: "a", name: "Alpha", status: "active", kind: "goods" },
  { id: "b", name: "Beta", status: "inactive", kind: "service" },
];

function renderRichTable(props: Partial<InteractiveEntityTableProps<RichRow>> = {}) {
  return renderWithProviders(
    <InteractiveEntityTable<RichRow>
      columns={[
        { id: "name", accessorKey: "name", header: "Nama", cell: ({ row }) => row.original.name },
        {
          id: "status",
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => row.original.status,
        },
        {
          accessorKey: "kind",
          header: () => "Jenis",
          meta: { filter: { type: "select" } },
          cell: ({ row }) => row.original.kind,
        },
        { id: "actions", header: "", cell: () => <button type="button">Edit</button> },
      ]}
      data={richRows}
      getRowId={(row) => row.id}
      searchKeys={["name"]}
      statusKey="status"
      statusOptions={[{ value: "active", label: "Aktif" }]}
      searchPlaceholder="Cari"
      ariaLabel="Rich"
      {...props}
    />,
  );
}

describe("InteractiveEntityTable (filters, selection, persistence)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("labels function headers and skips non-data columns in the export", async () => {
    const user = userEvent.setup();
    const exportSpy = vi.spyOn(exportModule, "exportCsv").mockImplementation(() => {});
    renderRichTable();

    await user.click(screen.getByRole("button", { name: "Ekspor" }));
    await waitFor(() =>
      expect(exportSpy).toHaveBeenCalledWith(
        "Rich",
        ["Nama", "Status", "Jenis"],
        [
          ["Alpha", "active", "goods"],
          ["Beta", "inactive", "service"],
        ],
      ),
    );
  });

  it("exports in the on-screen sort order", async () => {
    const user = userEvent.setup();
    const exportSpy = vi.spyOn(exportModule, "exportCsv").mockImplementation(() => {});
    renderRichTable();

    const sortName = screen.getByRole("button", { name: /Nama/ });
    await user.click(sortName);
    await user.click(sortName);
    await user.click(screen.getByRole("button", { name: "Ekspor" }));

    await waitFor(() => expect(exportSpy).toHaveBeenCalled());
    const exported = exportSpy.mock.calls[0]?.[2] as unknown[][];
    expect(exported.map((r) => r[0])).toEqual(["Beta", "Alpha"]);
  });

  it("builds a select filter from column meta with derived options", async () => {
    const user = userEvent.setup();
    renderRichTable();

    await user.click(screen.getByRole("button", { name: /^Filter/ }));
    await user.click(screen.getByRole("combobox", { name: "Jenis" }));
    const options = await screen.findAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Semua jenis", "goods", "service"]);

    await user.click(screen.getByRole("option", { name: "service" }));
    await waitFor(() => expect(screen.queryByText("Alpha")).not.toBeInTheDocument());
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("shows a selection bar with bulk actions and exports only selected rows", async () => {
    const user = userEvent.setup();
    const exportSpy = vi.spyOn(exportModule, "exportCsv").mockImplementation(() => {});
    renderRichTable({
      bulkActions: ({ rows: selected }) => <button type="button">Archive {selected.length}</button>,
    });

    await user.click(screen.getByRole("checkbox", { name: /b$/ }));

    const bar = await screen.findByRole("toolbar");
    expect(within(bar).getByRole("button", { name: "Archive 1" })).toBeInTheDocument();

    await user.click(within(bar).getByRole("button", { name: "Ekspor yang dipilih" }));
    await waitFor(() =>
      expect(exportSpy).toHaveBeenCalledWith(
        "Rich",
        ["Nama", "Status", "Jenis"],
        [["Beta", "inactive", "service"]],
      ),
    );

    await user.click(within(bar).getByRole("button", { name: "Hapus pilihan" }));
    await waitFor(() => expect(screen.queryByRole("toolbar")).not.toBeInTheDocument());
  });

  it("respects initialColumnVisibility and keeps the actions column out of the manager", async () => {
    const user = userEvent.setup();
    renderRichTable({ initialColumnVisibility: { kind: false } });

    expect(screen.queryByText("goods")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Kolom" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("checkbox", { name: "Jenis" })).not.toBeChecked();
  });

  it("does not allow hiding the last visible column", async () => {
    const user = userEvent.setup();
    renderRichTable({ initialColumnVisibility: { status: false, kind: false } });

    await user.click(screen.getByRole("button", { name: "Kolom" }));
    expect(screen.getByRole("checkbox", { name: "Nama" })).toHaveAttribute("aria-disabled", "true");
  });

  it("remembers column choices across mounts", async () => {
    const user = userEvent.setup();
    const first = renderRichTable();
    await user.click(screen.getByRole("button", { name: "Kolom" }));
    await user.click(screen.getByRole("checkbox", { name: "Status" }));
    first.unmount();

    renderRichTable();
    expect(screen.queryByRole("columnheader", { name: /Status/ })).not.toBeInTheDocument();
  });
});

type ManyRow = { id: string; name: string; group: string };

const manyRows: ManyRow[] = Array.from({ length: 20 }, (_, i) => ({
  id: `r${i + 1}`,
  name: `Item ${String(i + 1).padStart(2, "0")}`,
  group: i % 2 === 0 ? "even" : "odd",
}));

const manyColumns: ColumnDef<ManyRow, unknown>[] = [
  { id: "name", accessorKey: "name", header: "Nama" },
  { id: "group", accessorKey: "group", header: "Grup" },
];

function manyProps(
  props: Partial<InteractiveEntityTableProps<ManyRow>> = {},
): InteractiveEntityTableProps<ManyRow> {
  return {
    columns: manyColumns,
    data: manyRows,
    getRowId: (row) => row.id,
    searchKeys: ["name"],
    searchPlaceholder: "Cari",
    ariaLabel: "Many",
    ...props,
  };
}

function pageLabel() {
  return screen.getByText(/^Halaman \d+ dari \d+$/).textContent;
}

describe("InteractiveEntityTable (paging, URL, server mode, preferences)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the current page when the same rows arrive again", async () => {
    const user = userEvent.setup();
    const view = renderWithProviders(<InteractiveEntityTable<ManyRow> {...manyProps()} />);
    await user.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    expect(pageLabel()).toBe("Halaman 2 dari 3");

    view.rerender(<InteractiveEntityTable<ManyRow> {...manyProps({ data: [...manyRows] })} />);
    expect(pageLabel()).toBe("Halaman 2 dari 3");
  });

  it("returns to page 1 when the search changes and clamps when rows disappear", async () => {
    const user = userEvent.setup();
    const view = renderWithProviders(<InteractiveEntityTable<ManyRow> {...manyProps()} />);
    await user.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    await user.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    expect(pageLabel()).toBe("Halaman 3 dari 3");

    view.rerender(
      <InteractiveEntityTable<ManyRow> {...manyProps({ data: manyRows.slice(0, 10) })} />,
    );
    expect(pageLabel()).toBe("Halaman 2 dari 2");

    await user.type(screen.getByPlaceholderText("Cari"), "Item 0");
    await waitFor(() => expect(pageLabel()).toBe("Halaman 1 dari 2"));
  });

  it("drops selections whose rows were removed", async () => {
    const user = userEvent.setup();
    const view = renderWithProviders(<InteractiveEntityTable<ManyRow> {...manyProps()} />);
    await user.click(screen.getByRole("checkbox", { name: /r1$/ }));
    expect(await screen.findByRole("toolbar")).toBeInTheDocument();

    view.rerender(<InteractiveEntityTable<ManyRow> {...manyProps({ data: manyRows.slice(1) })} />);
    await waitFor(() => expect(screen.queryByRole("toolbar")).not.toBeInTheDocument());
    expect(screen.queryByText(/dipilih/)).not.toBeInTheDocument();
  });

  it("selects every matching row across pages", async () => {
    const user = userEvent.setup();
    renderWithProviders(<InteractiveEntityTable<ManyRow> {...manyProps()} />);
    await user.click(screen.getByRole("checkbox", { name: /r1$/ }));
    const bar = await screen.findByRole("toolbar");
    await user.click(within(bar).getByRole("button", { name: "Pilih semua 20" }));
    expect(within(bar).getByText("20 dipilih")).toBeInTheDocument();
    expect(within(bar).queryByRole("button", { name: /Pilih semua/ })).not.toBeInTheDocument();
  });

  it("restores search, sort and page from the URL and writes changes back", async () => {
    window.history.replaceState(null, "", "/?t_q=Item&t_s=name:desc&t_p=2");
    const user = userEvent.setup();
    renderWithProviders(<InteractiveEntityTable<ManyRow> {...manyProps({ urlStateKey: "t" })} />);

    expect(screen.getByPlaceholderText("Cari")).toHaveValue("Item");
    expect(pageLabel()).toBe("Halaman 2 dari 3");
    expect(screen.getByText("Item 12")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Cari"));
    await user.type(screen.getByPlaceholderText("Cari"), "Item 1");
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search);
      expect(params.get("t_q")).toBe("Item 1");
      expect(params.get("t_p")).toBeNull();
      expect(params.get("t_s")).toBe("name:desc");
    });
  });

  it("delegates paging, search and sort to the server", async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    renderWithProviders(
      <InteractiveEntityTable<ManyRow>
        {...manyProps({
          data: manyRows.slice(0, 8),
          server: { rowCount: 120, onQueryChange },
        })}
      />,
    );
    expect(onQueryChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "", pageIndex: 0, pageSize: 8, sorting: [] }),
    );
    expect(pageLabel()).toBe("Halaman 1 dari 15");

    await user.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ pageIndex: 1 }));

    await user.type(screen.getByPlaceholderText("Cari"), "abc");
    await waitFor(() =>
      expect(onQueryChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "abc", pageIndex: 0 }),
      ),
    );
    // Rows are not filtered locally in server mode.
    expect(screen.getByText("Item 01")).toBeInTheDocument();
  });

  it("resizes columns from the keyboard and remembers the width", async () => {
    const user = userEvent.setup();
    const first = renderWithProviders(<InteractiveEntityTable<ManyRow> {...manyProps()} />);
    const handle = screen.getByRole("separator", { name: "Ubah lebar kolom Nama" });
    handle.focus();
    await user.keyboard("{ArrowRight}{Shift>}{ArrowRight}{/Shift}");
    expect(columnWidths(first.container)[1]).toBe(210);
    first.unmount();

    const second = renderWithProviders(<InteractiveEntityTable<ManyRow> {...manyProps()} />);
    expect(columnWidths(second.container)[1]).toBe(210);
  });

  it("changes and remembers row density", async () => {
    const user = userEvent.setup();
    const first = renderWithProviders(<InteractiveEntityTable<ManyRow> {...manyProps()} />);
    await user.click(screen.getByRole("button", { name: "Kolom" }));
    await user.click(screen.getByRole("button", { name: "Rapat" }));
    expect(screen.getByText("Item 01").closest("td")).toHaveClass("py-1");
    first.unmount();

    renderWithProviders(<InteractiveEntityTable<ManyRow> {...manyProps()} />);
    expect(screen.getByText("Item 01").closest("td")).toHaveClass("py-1");
  });

  it("can pin the header and the first column", () => {
    const { container } = renderWithProviders(
      <InteractiveEntityTable<ManyRow>
        {...manyProps({ stickyHeader: true, maxHeight: 300, stickyFirstColumn: true })}
      />,
    );
    expect(container.querySelector("thead")).toHaveClass("sticky");
    const nameCell = screen.getByText("Item 01").closest("td") as HTMLElement;
    expect(nameCell).toHaveClass("sticky");
    expect(nameCell.style.left).toBe("48px");
    expect(
      (container.querySelector("[data-slot=table-container]") as HTMLElement).style.maxHeight,
    ).toBe("300px");
  });
});
