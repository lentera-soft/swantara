import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/lib/tests";
import * as exportModule from "@/lib/utils/csv";
import { InteractiveEntityTable } from "../interactive-entity-table";

type Row = { id: string; name: string; status: "active" | "inactive" };

const rows: Row[] = [
  { id: "a", name: "Alpha", status: "active" },
  { id: "b", name: "Beta", status: "inactive" },
];

function renderTable() {
  return renderWithProviders(
    <InteractiveEntityTable
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
  it("renders column resize handles by default", () => {
    const { container } = renderTable();
    expect(container.querySelectorAll(".cursor-col-resize")).toHaveLength(2);
  });

  it("renders a row resize strip on every body cell by default", () => {
    const { container } = renderTable();
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
    expect(columnWidths(container)).toEqual([40, 150, 100]);
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

  it("resizes a row by dragging the bottom strip", () => {
    const { container } = renderTable();
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
