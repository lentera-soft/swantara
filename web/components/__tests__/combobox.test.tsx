import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/combobox";
import { renderWithProviders } from "@/lib/tests";

describe("Combobox", () => {
  it("renders the input", () => {
    renderWithProviders(
      <Combobox>
        <ComboboxInput placeholder="Search..." />
      </Combobox>,
    );

    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders input group with data-slot", () => {
    renderWithProviders(
      <Combobox>
        <ComboboxInput placeholder="Pick one" />
      </Combobox>,
    );

    expect(
      screen.getByPlaceholderText("Pick one").closest("[data-slot='input-group']"),
    ).toBeInTheDocument();
  });

  it("renders content with list and items when open", () => {
    renderWithProviders(
      <Combobox open>
        <ComboboxInput placeholder="Search" />
        <ComboboxContent>
          <ComboboxList>
            <ComboboxItem value="apple">Apple</ComboboxItem>
            <ComboboxItem value="banana">Banana</ComboboxItem>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>,
    );

    expect(screen.getByText("Apple")).toHaveAttribute("data-slot", "combobox-item");
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });
});

describe("regression: combobox filtering", () => {
  const countries = [
    { code: "ID", name: "Indonesia" },
    { code: "SG", name: "Singapore" },
    { code: "US", name: "United States" },
  ];

  it("should narrow options to the matching label while typing", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Combobox
        items={countries.map((country) => country.code)}
        itemToStringLabel={(value) =>
          countries.find((country) => country.code === value)?.name ?? ""
        }
        value=""
        onValueChange={() => {}}
      >
        <ComboboxInput placeholder="Select country" />
        <ComboboxContent>
          <ComboboxList>
            {(code: string) => {
              const country = countries.find((c) => c.code === code);
              if (!country) return null;
              return (
                <ComboboxItem key={country.code} value={country.code}>
                  <span>{country.name}</span>
                </ComboboxItem>
              );
            }}
          </ComboboxList>
          <ComboboxEmpty>No results found</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>,
    );

    await user.click(screen.getByPlaceholderText("Select country"));
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getAllByRole("option")).toHaveLength(3);

    await user.type(screen.getByPlaceholderText("Select country"), "sing");

    expect(screen.queryAllByRole("option").map((option) => option.textContent)).toEqual([
      "Singapore",
    ]);
  });
});

describe("combobox deselect", () => {
  const fruits = ["Apple", "Banana"];

  function renderCombobox(onValueChange: () => void) {
    return renderWithProviders(
      <Combobox items={fruits} onValueChange={onValueChange}>
        <ComboboxInput placeholder="Pick a fruit" />
        <ComboboxContent>
          <ComboboxList>
            {(fruit: string) => (
              <ComboboxItem key={fruit} value={fruit}>
                {fruit}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>,
    );
  }

  it("deselects when clicking the already selected item again", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn(() => {});
    renderCombobox(onValueChange);

    const input = screen.getByPlaceholderText("Pick a fruit");
    await user.click(input);
    await user.click(await screen.findByRole("option", { name: "Apple" }));
    expect(onValueChange).toHaveBeenLastCalledWith(
      "Apple",
      expect.objectContaining({ reason: "item-press" }),
    );

    await user.click(input);
    await user.click(await screen.findByRole("option", { name: "Apple" }));
    expect(onValueChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ reason: "item-press" }),
    );
    expect(input).toHaveValue("");
  });

  it("clears the selection via the clear button", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn(() => {});
    const { container } = renderCombobox(onValueChange);

    const input = screen.getByPlaceholderText("Pick a fruit");
    await user.click(input);
    await user.click(await screen.findByRole("option", { name: "Apple" }));

    const clearButton = container.querySelector("[data-slot='combobox-clear']");
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton as HTMLElement);
    expect(onValueChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ reason: "clear-press" }),
    );
    expect(input).toHaveValue("");
  });
});
