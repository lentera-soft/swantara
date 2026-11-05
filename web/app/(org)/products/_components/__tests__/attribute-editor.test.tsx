import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/lib/tests";
import { AttributeEditor, type AttributeRow } from "../attribute-editor";

function renderEditor(initial: AttributeRow[]) {
  function Harness() {
    const [value, setValue] = useState<AttributeRow[]>(initial);
    return <AttributeEditor value={value} onChange={setValue} />;
  }
  return renderWithProviders(<Harness />);
}

describe("AttributeEditor", () => {
  it("renders existing attributes with value chips", () => {
    renderEditor([{ id: "a1", name: "Color", values: ["Red", "Blue"] }]);

    expect(screen.getByDisplayValue("Color")).toBeInTheDocument();
    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
  });

  it("adds a new attribute row", async () => {
    const user = userEvent.setup();
    renderEditor([]);

    await user.click(screen.getByRole("button", { name: "Tambah atribut" }));

    expect(screen.getByPlaceholderText("Atribut")).toBeInTheDocument();
  });

  it("commits a typed value as a chip on Enter", async () => {
    const user = userEvent.setup();
    renderEditor([{ id: "a1", name: "Size", values: [] }]);

    const valueInput = screen.getByPlaceholderText("Ketik nilai, tekan Enter");
    await user.type(valueInput, "Blue{Enter}");

    expect(screen.getByText("Blue")).toBeInTheDocument();
    expect(valueInput).toHaveValue("");
  });

  it("commits comma-separated values and ignores duplicates", async () => {
    const user = userEvent.setup();
    renderEditor([{ id: "a1", name: "Size", values: ["Red"] }]);

    const valueInput = screen.getByRole("textbox", { name: /Ketik nilai/ });
    await user.type(valueInput, "Blue, red,{Enter}");

    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
    expect(screen.queryAllByText("Red")).toHaveLength(1);
  });

  it("removes a single value chip", async () => {
    const user = userEvent.setup();
    renderEditor([{ id: "a1", name: "Color", values: ["Red", "Blue"] }]);

    await user.click(screen.getByRole("button", { name: "Hapus Red" }));

    expect(screen.queryByText("Red")).not.toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
  });

  it("removes the last chip on Backspace in an empty draft", async () => {
    const user = userEvent.setup();
    renderEditor([{ id: "a1", name: "Color", values: ["Red"] }]);

    const valueInput = screen.getByRole("textbox", { name: /Ketik nilai/ });
    await user.type(valueInput, "{Backspace}");

    expect(screen.queryByText("Red")).not.toBeInTheDocument();
  });

  it("removes an attribute row", async () => {
    const user = userEvent.setup();
    renderEditor([{ id: "a1", name: "Color", values: ["Red"] }]);

    await user.click(screen.getByRole("button", { name: "Hapus" }));

    expect(screen.queryByDisplayValue("Color")).not.toBeInTheDocument();
  });
});
