import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { navigationMock, renderWithProviders, server } from "@/lib/tests";
import { EmployeeForm, EmployeeFormEdit } from "../employee-form";

const departments = [{ id: 2, name: "Engineering" }];
const positions = [{ id: 3, name: "Developer" }];

function seedLists() {
  server.use(
    http.get("*/api/v1/organizations/:organizationId/departments", () =>
      HttpResponse.json({ success: true, message: "OK.", data: { departments } }),
    ),
    http.get("*/api/v1/organizations/:organizationId/job-positions", () =>
      HttpResponse.json({ success: true, message: "OK.", data: positions }),
    ),
  );
}

function seedCreate(status = 200) {
  server.use(
    http.post("*/api/v1/organizations/:organizationId/employees", () => {
      if (status !== 200) {
        return HttpResponse.json({ success: false, message: "Error." }, { status });
      }
      return HttpResponse.json({
        success: true,
        message: "OK.",
        data: { id: 9 },
      });
    }),
  );
}

function seedUpdate(status = 200) {
  server.use(
    http.put("*/api/v1/organizations/:organizationId/employees/:id", () => {
      if (status !== 200) {
        return HttpResponse.json({ success: false, message: "Error." }, { status });
      }
      return HttpResponse.json({
        success: true,
        message: "OK.",
        data: { id: 4 },
      });
    }),
  );
}

const editInitial = {
  id: 4,
  employeeNumber: "EMP-0004",
  userId: null,
  departmentId: null,
  jobPositionId: null,
  managerId: null,
  hireDate: null,
  terminationDate: null,
  employmentType: "full_time",
  workLocation: null,
  active: true,
} as never;

const editInitialFilled = {
  id: 5,
  employeeNumber: "EMP-0005",
  userId: 7,
  departmentId: 2,
  jobPositionId: 3,
  managerId: 1,
  hireDate: "2024-02-01",
  terminationDate: null,
  employmentType: "part_time",
  workLocation: "Jakarta",
  active: true,
} as never;

beforeEach(() => {
  seedLists();
  navigationMock.push.mockClear();
});

describe("EmployeeForm", () => {
  it("shows edit title with prefilled employee number", async () => {
    renderWithProviders(<EmployeeForm orgId="1" initial={editInitial} />);

    expect(await screen.findByRole("heading", { name: "Ubah karyawan" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("EMP-0004")).toBeInTheDocument();
  });

  it("blocks submit when required fields are empty", async () => {
    const user = userEvent.setup();
    seedCreate();
    renderWithProviders(<EmployeeForm orgId="1" />);

    await screen.findByRole("heading", { name: "Tambah Karyawan" });
    await user.click(screen.getByRole("button", { name: "Tambah Karyawan" }));

    await waitFor(() => expect(navigationMock.push).not.toHaveBeenCalled());
    expect(screen.getByDisplayValue("0")).toBeInTheDocument();
  });

  it("creates an employee with contract and hourly terms", async () => {
    const user = userEvent.setup();
    seedCreate();
    renderWithProviders(<EmployeeForm orgId="1" />);

    await screen.findByRole("heading", { name: "Tambah Karyawan" });
    await user.type(screen.getByPlaceholderText("Nama"), "Alex");
    await user.type(screen.getByLabelText("Nomor karyawan"), "EMP-1");
    await user.click(screen.getByRole("combobox", { name: "Jenis kepegawaian" }));
    await user.click(await screen.findByRole("option", { name: "Kontrak" }));
    await user.click(screen.getByRole("combobox", { name: "Jenis upah" }));
    await user.click(await screen.findByRole("option", { name: "Per jam" }));
    await user.click(screen.getByRole("button", { name: "Tambah Karyawan" }));

    await waitFor(() => expect(navigationMock.push).toHaveBeenCalledWith("/employees/9"));
  });

  it("creates an employee with optional fields filled and phone placeholder prefix", async () => {
    const user = userEvent.setup();
    seedCreate();
    renderWithProviders(<EmployeeForm orgId="1" />);

    await screen.findByRole("heading", { name: "Tambah Karyawan" });
    await user.type(screen.getByPlaceholderText("Nama"), "June");
    await user.type(screen.getByLabelText("Nomor karyawan"), "EMP-2");
    await user.type(screen.getByPlaceholderText("Email"), "june@acme.com");

    const phone = screen.getByPlaceholderText("+62 812 3456 7890");
    await user.click(screen.getByRole("combobox", { name: "Phone" }));
    await user.click(await screen.findByRole("option", { name: /^Amerika Serikat\+1$/ }));
    await user.type(screen.getByPlaceholderText("+1 812 3456 7890"), "8123456789");

    await user.click(screen.getByRole("combobox", { name: "Departemen" }));
    await user.click(await screen.findByRole("option", { name: "Engineering" }));
    await user.click(screen.getByRole("combobox", { name: "Jabatan" }));
    await user.click(await screen.findByRole("option", { name: "Developer" }));
    await user.click(screen.getByRole("button", { name: "Tambah Karyawan" }));

    await waitFor(() => expect(navigationMock.push).toHaveBeenCalledWith("/employees/9"));
    expect(phone).toBeTruthy();
  });

  it("does not navigate when creation fails", async () => {
    const user = userEvent.setup();
    seedCreate(500);
    renderWithProviders(<EmployeeForm orgId="1" />);

    await screen.findByRole("heading", { name: "Tambah Karyawan" });
    await user.type(screen.getByPlaceholderText("Nama"), "Alex");
    await user.type(screen.getByLabelText("Nomor karyawan"), "EMP-1");
    await user.click(screen.getByRole("button", { name: "Tambah Karyawan" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Tambah Karyawan" })).toBeInTheDocument(),
    );
    expect(navigationMock.push).not.toHaveBeenCalled();
  });

  it("updates an employee with empty optionals", async () => {
    const user = userEvent.setup();
    seedUpdate();
    renderWithProviders(<EmployeeForm orgId="1" initial={editInitial} />);

    await screen.findByRole("heading", { name: "Ubah karyawan" });
    await user.type(screen.getByPlaceholderText("Nama"), "Alex Updated");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(navigationMock.push).toHaveBeenCalledWith("/employees/4"));
  });

  it("updates an employee with filled optionals", async () => {
    const user = userEvent.setup();
    seedUpdate();
    renderWithProviders(<EmployeeForm orgId="1" initial={editInitialFilled} />);

    await screen.findByRole("heading", { name: "Ubah karyawan" });
    expect(screen.getByDisplayValue("Jakarta")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Nama"), "June Updated");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(navigationMock.push).toHaveBeenCalledWith("/employees/5"));
  });

  it("does not navigate when update fails", async () => {
    const user = userEvent.setup();
    seedUpdate(500);
    renderWithProviders(<EmployeeForm orgId="1" initial={editInitial} />);

    await screen.findByRole("heading", { name: "Ubah karyawan" });
    await user.type(screen.getByPlaceholderText("Nama"), "Alex");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Ubah karyawan" })).toBeInTheDocument(),
    );
    expect(navigationMock.push).not.toHaveBeenCalled();
  });

  it("navigates back to the cancel href", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeeForm orgId="1" />);

    await screen.findByRole("heading", { name: "Tambah Karyawan" });
    await user.click(screen.getByRole("link", { name: "Batal" }));
  });
});

describe("EmployeeFormEdit", () => {
  function seedEmployeeGet(status = 200) {
    server.use(
      http.get("*/api/v1/organizations/:organizationId/employees/:id", () => {
        if (status !== 200) {
          return HttpResponse.json({ success: false, message: "Error." }, { status });
        }
        return HttpResponse.json({ success: true, message: "OK.", data: editInitialFilled });
      }),
    );
  }

  it("loads the employee and renders the edit form", async () => {
    seedEmployeeGet();
    renderWithProviders(<EmployeeFormEdit orgId="1" employeeId="5" />);

    expect(await screen.findByRole("heading", { name: "Ubah karyawan" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("EMP-0005")).toBeInTheDocument();
  });

  it("shows not found when the employee is missing", async () => {
    server.use(
      http.get("*/api/v1/organizations/:organizationId/employees/:id", () =>
        HttpResponse.json({ success: true, message: "OK.", data: null }),
      ),
    );
    renderWithProviders(<EmployeeFormEdit orgId="1" employeeId="404" />);

    expect(await screen.findByText(/Karyawan tidak ditemukan/)).toBeInTheDocument();
  });
});
