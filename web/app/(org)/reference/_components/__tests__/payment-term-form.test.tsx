import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { navigationMock, renderWithProviders, server } from "@/lib/tests";
import { PaymentTermForm, PaymentTermFormEdit } from "../payment-term-form";

async function fillLine(
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  value: string,
  days: string,
) {
  if (value !== "") await user.type(screen.getAllByLabelText("Nilai")[index]!, value);
  await user.type(screen.getAllByLabelText("Hari jatuh tempo")[index]!, days);
}

async function setLineType(user: ReturnType<typeof userEvent.setup>, index: number, name: string) {
  await user.click(screen.getAllByLabelText("Jenis")[index]!);
  await user.click(await screen.findByRole("option", { name }));
}

describe("PaymentTermForm", () => {
  it("requires a name when creating a term", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentTermForm orgId="1" />);

    await user.click(screen.getByRole("button", { name: "Simpan syarat" }));

    expect(screen.getByText("Masukkan nama.")).toBeInTheDocument();
  });

  it("starts with one line and supports adding and removing lines", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentTermForm orgId="1" />);

    expect(screen.getAllByLabelText("Nilai")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Tambah baris" }));
    expect(screen.getAllByLabelText("Nilai")).toHaveLength(2);

    await user.click(screen.getAllByRole("button", { name: /^Hapus baris/ })[1]!);
    expect(screen.getAllByLabelText("Nilai")).toHaveLength(1);
  });

  it("requires at least one line", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentTermForm orgId="1" />);

    await user.type(screen.getByLabelText("Nama"), "Empty term");
    await user.click(screen.getByRole("button", { name: /^Hapus baris/ }));
    await user.click(screen.getByRole("button", { name: "Simpan syarat" }));

    expect(await screen.findByText("Tambahkan minimal satu baris.")).toBeInTheDocument();
  });

  it("rejects percent lines that do not add up to 100", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentTermForm orgId="1" />);

    await user.type(screen.getByLabelText("Nama"), "60/60");
    await fillLine(user, 0, "60", "30");
    await user.click(screen.getByRole("button", { name: "Tambah baris" }));
    await fillLine(user, 1, "60", "60");
    await user.click(screen.getByRole("button", { name: "Simpan syarat" }));

    expect(
      screen.getByText("Baris persen harus berjumlah 100%. Total saat ini: 120%."),
    ).toBeInTheDocument();
  });

  it("rejects more than one balance line", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentTermForm orgId="1" />);

    await user.type(screen.getByLabelText("Nama"), "Double balance");
    await setLineType(user, 0, "Saldo");
    await fillLine(user, 0, "", "30");
    await user.click(screen.getByRole("button", { name: "Tambah baris" }));
    await setLineType(user, 1, "Saldo");
    await fillLine(user, 1, "", "60");
    await user.click(screen.getByRole("button", { name: "Simpan syarat" }));

    expect(await screen.findByText("Hanya satu baris saldo yang diizinkan.")).toBeInTheDocument();
  });

  it("allows percent lines below 100 when a balance line absorbs the remainder", async () => {
    let created: unknown = null;
    server.use(
      http.post("*/api/v1/organizations/:organizationId/payment-terms", async ({ request }) => {
        created = await request.json();
        return HttpResponse.json(
          {
            success: true,
            message: "Created.",
            data: { payment_term: { id: 9, name: "Partial", lines: [] } },
          },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<PaymentTermForm orgId="1" />);

    await user.type(screen.getByLabelText("Nama"), "Partial");
    await fillLine(user, 0, "40", "0");
    await user.click(screen.getByRole("button", { name: "Tambah baris" }));
    await setLineType(user, 1, "Saldo");
    await fillLine(user, 1, "", "30");
    await user.click(screen.getByRole("button", { name: "Simpan syarat" }));

    await waitFor(() => expect(created).toMatchObject({ name: "Partial" }));
    expect(created).toMatchObject({
      code: null,
      is_active: true,
      template_key: null,
      note: null,
      lines: [
        {
          sequence: 1,
          value_type: "percent",
          value: 40,
          days_after: 0,
          day_of_month: null,
          discount_pct: null,
          discount_days: null,
        },
        {
          sequence: 2,
          value_type: "balance",
          value: 0,
          days_after: 30,
          day_of_month: null,
          discount_pct: null,
          discount_days: null,
        },
      ],
    });
    await waitFor(() =>
      expect(navigationMock.push).toHaveBeenCalledWith("/reference/payment-terms"),
    );
  });

  it("creates a term whose percent lines add up to 100", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentTermForm orgId="1" />);

    await user.type(screen.getByLabelText("Nama"), "60/40");
    await fillLine(user, 0, "60", "0");
    await user.click(screen.getByRole("button", { name: "Tambah baris" }));
    await fillLine(user, 1, "40", "30");
    await user.click(screen.getByRole("button", { name: "Simpan syarat" }));

    await waitFor(() =>
      expect(navigationMock.push).toHaveBeenCalledWith("/reference/payment-terms"),
    );
  });

  it("links the cancel button back to the list", () => {
    renderWithProviders(<PaymentTermForm orgId="1" />);

    expect(screen.getByRole("link", { name: "Batal" })).toHaveAttribute(
      "href",
      "/reference/payment-terms",
    );
  });
});

describe("PaymentTermFormEdit", () => {
  it("loads an existing term with its lines", async () => {
    renderWithProviders(<PaymentTermFormEdit orgId="1" termId="2" />);

    expect(await screen.findByDisplayValue("50/50 split")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("50")).toHaveLength(2);
    expect(screen.getAllByDisplayValue("30")).toHaveLength(1);
  });

  it("updates an existing term", async () => {
    let updated: unknown = null;
    server.use(
      http.put(
        "*/api/v1/organizations/:organizationId/payment-terms/:paymentTermId",
        async ({ request }) => {
          updated = await request.json();
          return HttpResponse.json({ success: true, message: "OK.", data: {} });
        },
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<PaymentTermFormEdit orgId="1" termId="2" />);

    await screen.findByDisplayValue("50/50 split");
    await user.clear(screen.getByLabelText("Nama"));
    await user.type(screen.getByLabelText("Nama"), "55/45");
    const valueInputs = screen.getAllByLabelText("Nilai");
    await user.clear(valueInputs[0]!);
    await user.type(valueInputs[0]!, "55");
    await user.clear(valueInputs[1]!);
    await user.type(valueInputs[1]!, "45");
    await user.click(screen.getByRole("button", { name: "Simpan syarat" }));

    await waitFor(() =>
      expect(updated).toMatchObject({
        name: "55/45",
        code: "SPLIT50",
        is_active: true,
        template_key: null,
        lines: [
          { sequence: 1, value: 55, days_after: 0, day_of_month: null },
          { sequence: 2, value: 45, days_after: 30, day_of_month: null },
        ],
      }),
    );
    await waitFor(() =>
      expect(navigationMock.push).toHaveBeenCalledWith("/reference/payment-terms"),
    );
  });

  it("shows an error when the term cannot be found", async () => {
    server.use(
      http.get("*/api/v1/organizations/:organizationId/payment-terms/:paymentTermId", () =>
        HttpResponse.json({ success: false, message: "Term missing." }, { status: 404 }),
      ),
    );
    renderWithProviders(<PaymentTermFormEdit orgId="1" termId="999" />);

    expect(await screen.findByText("Term missing.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nama")).not.toBeInTheDocument();
  });
});
