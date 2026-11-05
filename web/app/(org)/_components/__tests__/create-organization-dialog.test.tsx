import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { setActiveOrg } from "@/lib/server/active-org-actions";
import { navigationMock, renderWithProviders, server } from "@/lib/tests";
import { CreateOrganizationDialog } from "../create-organization-dialog";

vi.mock("@/lib/server/active-org-actions", () => ({
  setActiveOrg: vi.fn(async () => {}),
  clearActiveOrg: vi.fn(async () => {}),
}));

async function selectCountry(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByLabelText(/Negara/i));
  const listbox = await screen.findByRole("listbox");
  await user.click(await within(listbox).findByText(name));
}

describe("CreateOrganizationDialog", () => {
  it("renders name, country, and currency fields when open", async () => {
    renderWithProviders(<CreateOrganizationDialog open={true} onOpenChange={vi.fn()} />);

    expect(await screen.findByText("Buat organisasi")).toBeInTheDocument();
    expect(screen.getByLabelText("Nama perusahaan")).toBeInTheDocument();
    expect(screen.getByLabelText(/Negara/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mata uang/i)).toBeInTheDocument();
  });

  it("creates an organization and navigates to its dashboard", async () => {
    const toastSpy = vi.spyOn(toast, "success");
    let body: unknown;
    server.use(
      http.post("*/api/v1/organizations/quick", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { success: true, data: { organization: { id: 9, name: "Acme Inc" } } },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(<CreateOrganizationDialog open={true} onOpenChange={onOpenChange} />);

    await user.type(await screen.findByLabelText("Nama perusahaan"), "Acme Inc");
    await selectCountry(user, "Indonesia");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith("Organisasi dibuat");
    });
    expect(body).toMatchObject({
      name: "Acme Inc",
      country_code: "ID",
      standard_code: "PSAK_EMKM",
      base_currency: "IDR",
    });
    expect(setActiveOrg).toHaveBeenCalledWith(9);
    expect(navigationMock.push).toHaveBeenCalledWith("/dashboard");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("debounces the country search request", async () => {
    const listRequests: string[] = [];
    server.use(
      http.get(
        "*/api/v1/countries",
        ({ request }) => {
          listRequests.push(request.url);
          return HttpResponse.json({
            success: true,
            message: "OK.",
            data: { countries: [] },
          });
        },
        { once: false },
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<CreateOrganizationDialog open={true} onOpenChange={vi.fn()} />);

    const input = await screen.findByLabelText(/Negara/i);
    await user.type(input, "indo");

    const filteredRequests = () =>
      listRequests.filter((url) => decodeURIComponent(url).includes("name:like"));

    await waitFor(
      () => {
        expect(filteredRequests()).toHaveLength(1);
      },
      { timeout: 3000 },
    );
    const filteredUrl = filteredRequests()[0] ?? "";
    expect(decodeURIComponent(filteredUrl)).toContain("name:like:indo");
    expect(listRequests.length).toBeLessThanOrEqual(2);
  });
});
