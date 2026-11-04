import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { navigationMock, renderWithProviders, server } from "@/lib/tests";
import { WarehouseForm } from "../warehouse-form";

function seedCreate(status = 200) {
  server.use(
    http.post("*/api/v1/organizations/:organizationId/warehouses", () => {
      if (status !== 200) {
        return HttpResponse.json({ success: false, message: "Error." }, { status });
      }
      return HttpResponse.json({
        success: true,
        message: "OK.",
        data: {
          warehouse: {
            id: 9,
            organization_id: 1,
            name: "East Warehouse",
            code: null,
            line1: null,
            line2: null,
            city: null,
            state: null,
            postal_code: null,
            country_code: null,
          },
        },
      });
    }),
  );
}

function seedUpdate(status = 200) {
  server.use(
    http.put("*/api/v1/organizations/:organizationId/warehouses/:id", () => {
      if (status !== 200) {
        return HttpResponse.json({ success: false, message: "Error." }, { status });
      }
      return HttpResponse.json({
        success: true,
        message: "OK.",
        data: {
          warehouse: {
            id: 4,
            organization_id: 1,
            name: "Main Warehouse",
            code: "WH-01",
            line1: "Jl. Merdeka 1",
            line2: null,
            city: "Jakarta",
            state: null,
            postal_code: null,
            country_code: null,
          },
        },
      });
    }),
  );
}

const editInitial = {
  id: 4,
  organizationId: 1,
  name: "Main Warehouse",
  code: null,
  line1: null,
  line2: null,
  city: null,
  state: null,
  postalCode: null,
  countryCode: null,
} as never;

const editInitialFilled = {
  id: 5,
  organizationId: 1,
  name: "East Warehouse",
  code: "WH-02",
  line1: "Jl. Merdeka 1",
  line2: "Block B",
  city: "Jakarta",
  state: "DKI",
  postalCode: "10110",
  countryCode: "ID",
} as never;

beforeEach(() => {
  navigationMock.push.mockClear();
});

describe("WarehouseForm branches", () => {
  it("shows edit title with prefilled values", async () => {
    renderWithProviders(<WarehouseForm orgId="1" initial={editInitialFilled} />);

    expect(await screen.findByRole("heading", { name: "Ubah gudang" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("WH-02")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Block B")).toBeInTheDocument();
  });

  it("blocks submit when name is empty", async () => {
    const user = userEvent.setup();
    seedCreate();
    renderWithProviders(<WarehouseForm orgId="1" />);

    await screen.findByRole("heading", { name: "Gudang baru" });
    await user.click(screen.getByRole("button", { name: "Tambah gudang" }));

    expect(await screen.findByText("Nama gudang wajib diisi.")).toBeInTheDocument();
    expect(navigationMock.push).not.toHaveBeenCalled();
  });

  it("creates a warehouse with only a name", async () => {
    const user = userEvent.setup();
    seedCreate();
    renderWithProviders(<WarehouseForm orgId="1" />);

    await user.type(await screen.findByPlaceholderText("Nama"), "East Warehouse");
    await user.click(screen.getByRole("button", { name: "Tambah gudang" }));

    await waitFor(() => expect(navigationMock.push).toHaveBeenCalledWith("/stock/warehouses/9"));
  });

  it("creates a warehouse with a full address", async () => {
    const user = userEvent.setup();
    seedCreate();
    renderWithProviders(<WarehouseForm orgId="1" />);

    await user.type(await screen.findByPlaceholderText("Nama"), "East Warehouse");
    await user.type(screen.getByPlaceholderText("Kode"), "WH-02");
    await user.type(screen.getByPlaceholderText("Alamat baris 1"), "Jl. Merdeka 1");
    await user.type(screen.getByPlaceholderText("Alamat baris 2"), "Block B");
    await user.type(screen.getByPlaceholderText("Kota"), "Jakarta");
    await user.type(screen.getByPlaceholderText("Provinsi"), "DKI");
    await user.type(screen.getByPlaceholderText("Kode pos"), "10110");
    await user.type(screen.getByPlaceholderText("Kode negara"), "ID");
    await user.click(screen.getByRole("button", { name: "Tambah gudang" }));

    await waitFor(() => expect(navigationMock.push).toHaveBeenCalledWith("/stock/warehouses/9"));
  });

  it("does not save when creation fails", async () => {
    const user = userEvent.setup();
    seedCreate(500);
    renderWithProviders(<WarehouseForm orgId="1" />);

    await user.type(await screen.findByPlaceholderText("Nama"), "East Warehouse");
    await user.click(screen.getByRole("button", { name: "Tambah gudang" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Gudang baru" })).toBeInTheDocument(),
    );
    expect(navigationMock.push).not.toHaveBeenCalled();
  });

  it("updates a warehouse from empty optionals", async () => {
    const user = userEvent.setup();
    seedUpdate();
    renderWithProviders(<WarehouseForm orgId="1" initial={editInitial} />);

    await screen.findByRole("heading", { name: "Ubah gudang" });
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(navigationMock.push).toHaveBeenCalledWith("/stock/warehouses/4"));
  });

  it("updates a warehouse with filled optionals", async () => {
    const user = userEvent.setup();
    seedUpdate();
    renderWithProviders(<WarehouseForm orgId="1" initial={editInitialFilled} />);

    await screen.findByRole("heading", { name: "Ubah gudang" });
    await user.clear(screen.getByDisplayValue("Block B"));
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(navigationMock.push).toHaveBeenCalledWith("/stock/warehouses/5"));
  });

  it("does not save when update fails", async () => {
    const user = userEvent.setup();
    seedUpdate(500);
    renderWithProviders(<WarehouseForm orgId="1" initial={editInitial} />);

    await screen.findByRole("heading", { name: "Ubah gudang" });
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Ubah gudang" })).toBeInTheDocument(),
    );
    expect(navigationMock.push).not.toHaveBeenCalled();
  });

  it("cancels with a link back to the list", async () => {
    renderWithProviders(<WarehouseForm orgId="1" />);

    await screen.findByRole("heading", { name: "Gudang baru" });

    expect(screen.getByRole("link", { name: "Batal" })).toHaveAttribute(
      "href",
      "/stock/warehouses",
    );
    expect(navigationMock.push).not.toHaveBeenCalled();
  });
});
