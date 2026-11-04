import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/lib/tests";
import { WarehouseForm } from "../warehouse-form";

describe("WarehouseForm", () => {
  it("renders grouped fieldsets for the warehouse form", async () => {
    renderWithProviders(<WarehouseForm orgId="1" />);

    expect(await screen.findByRole("heading", { name: "Gudang baru" })).toBeInTheDocument();
    expect(screen.getByText("Umum")).toBeInTheDocument();
    expect(screen.getByText("Alamat")).toBeInTheDocument();
  });

  it("accepts a warehouse name through typing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<WarehouseForm orgId="1" />);

    await user.type(await screen.findByPlaceholderText("Nama"), "East Warehouse");

    expect(screen.getByDisplayValue("East Warehouse")).toBeInTheDocument();
  });

  it("links the cancel button back to the warehouse list", async () => {
    renderWithProviders(<WarehouseForm orgId="1" />);

    await screen.findByRole("heading", { name: "Gudang baru" });

    expect(screen.getByRole("link", { name: "Batal" })).toHaveAttribute(
      "href",
      "/stock/warehouses",
    );
  });
});
