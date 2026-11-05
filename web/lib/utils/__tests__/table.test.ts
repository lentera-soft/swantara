import { describe, expect, it } from "vitest";
import {
  getColumnId,
  getColumnLabel,
  getColumnValue,
  hasColumnAccessor,
  resolvePath,
} from "../table";

describe("getColumnLabel", () => {
  it("prefers the string header", () => {
    expect(getColumnLabel({ header: "Name" })).toBe("Name");
  });

  it("falls back to accessorKey", () => {
    expect(getColumnLabel({ accessorKey: "email" })).toBe("email");
  });

  it("prefers meta.label and resolves context-free header renderers", () => {
    expect(getColumnLabel({ header: "Name", meta: { label: "Full name" } } as never)).toBe(
      "Full name",
    );
    expect(getColumnLabel({ accessorKey: "categoryId", header: () => "Category" })).toBe(
      "Category",
    );
  });

  it("does not call header renderers that need the header context", () => {
    expect(
      getColumnLabel({ accessorKey: "email", header: (_ctx: unknown) => "Email" } as never),
    ).toBe("email");
  });

  it("falls back to id and then empty string", () => {
    expect(getColumnLabel({ id: "actions" } as never)).toBe("actions");
    expect(getColumnLabel({} as never)).toBe("");
  });
});

describe("resolvePath", () => {
  it("resolves nested paths", () => {
    expect(resolvePath({ a: { b: 2 } }, "a.b")).toBe(2);
  });

  it("returns undefined for missing or null segments", () => {
    expect(resolvePath({ a: {} }, "a.b.c")).toBeUndefined();
    expect(resolvePath(null, "a")).toBeUndefined();
  });
});

describe("getColumnValue", () => {
  it("uses accessorFn when present", () => {
    expect(
      getColumnValue({ id: "n", accessorFn: (row: { n: number }) => row.n * 2 }, { n: 3 }),
    ).toBe(6);
  });

  it("resolves accessorKey paths", () => {
    expect(getColumnValue({ accessorKey: "a.b" }, { a: { b: "hit" } })).toBe("hit");
  });

  it("returns undefined without an accessor", () => {
    expect(getColumnValue({ id: "actions" } as never, { a: 1 })).toBeUndefined();
  });
});

describe("getColumnId", () => {
  it("mirrors TanStack id derivation", () => {
    expect(getColumnId({ id: "x", accessorKey: "a" } as never)).toBe("x");
    expect(getColumnId({ accessorKey: "a.b" } as never)).toBe("a_b");
    expect(getColumnId({ header: "Name" } as never)).toBe("Name");
  });
});

describe("hasColumnAccessor", () => {
  it("detects data-bearing columns", () => {
    expect(hasColumnAccessor({ accessorKey: "a" } as never)).toBe(true);
    expect(hasColumnAccessor({ id: "n", accessorFn: () => 1 } as never)).toBe(true);
    expect(hasColumnAccessor({ id: "actions" } as never)).toBe(false);
  });
});
