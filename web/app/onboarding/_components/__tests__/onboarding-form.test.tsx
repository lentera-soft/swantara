import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/lib/tests";
import { useOnboardingFormStore } from "../../_hooks/onboarding-form-store";
import OnboardingForm from "../onboarding-form";

async function selectCountry(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByLabelText(/Negara/i));
  const listbox = await screen.findByRole("listbox");
  await user.click(within(listbox).getByText(name));
}

describe("OnboardingForm", () => {
  beforeEach(() => {
    useOnboardingFormStore.setState({ step: "companyInfo", isPending: false });
  });

  it("renders the company info step first", () => {
    renderWithProviders(<OnboardingForm />);

    expect(screen.getByLabelText(/Nama perusahaan/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Negara/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mata uang/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lanjut/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Buat Perusahaan/i })).not.toBeInTheDocument();
  });

  it("creates the company with the selected currency and address", async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post("*/api/v1/organizations/quick", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { success: true, data: { organization: { id: 1, name: "Acme Inc" } } },
          { status: 201 },
        );
      }),
    );
    renderWithProviders(<OnboardingForm />);

    await user.type(screen.getByLabelText(/Nama perusahaan/i), "Acme Inc");
    await selectCountry(user, "Indonesia");
    await user.click(screen.getByRole("button", { name: /Lanjut/i }));

    await user.type(await screen.findByLabelText(/Alamat perusahaan/i), "Jl. Sudirman 1");
    await user.type(screen.getByLabelText(/^Kota$/i), "Jakarta");
    await user.type(screen.getByLabelText(/Kode pos/i), "10220");
    await user.click(screen.getByRole("button", { name: /Buat Perusahaan/i }));

    expect(body).toMatchObject({
      name: "Acme Inc",
      country_code: "ID",
      standard_code: "PSAK_EMKM",
      base_currency: "IDR",
      address: "Jl. Sudirman 1",
      city: "Jakarta",
      postal_code: "10220",
    });
  });

  it("allows skipping the address step", async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post("*/api/v1/organizations/quick", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { success: true, data: { organization: { id: 1, name: "Acme Inc" } } },
          { status: 201 },
        );
      }),
    );
    renderWithProviders(<OnboardingForm />);

    await user.type(screen.getByLabelText(/Nama perusahaan/i), "Acme Inc");
    await selectCountry(user, "Indonesia");
    await user.click(screen.getByRole("button", { name: /Lanjut/i }));
    await screen.findByLabelText(/Alamat perusahaan/i);
    await user.click(screen.getByRole("button", { name: /Lewati/i }));

    expect(body).toMatchObject({
      name: "Acme Inc",
      country_code: "ID",
      base_currency: "IDR",
    });
    expect(body).not.toHaveProperty("address");
  });
});
