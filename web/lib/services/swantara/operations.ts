import type { AxiosInstance } from "axios";
import { endpoints } from "./endpoints";
import type {
  Account,
  Accrual,
  AccrualResult,
  AgingRow,
  ApprovalRequest,
  ArApKpi,
  Attachment,
  Attendance,
  BalanceSheet,
  BillTimeMaterialRequest,
  Carrier,
  CashFlow,
  CashKpi,
  CheckInRequest,
  CheckOutRequest,
  ClosePeriodRequest,
  CloseResult,
  ConfirmPayrollRunRequest,
  ConvertUnitRequest,
  Country,
  CreateAccountRequest,
  CreateAccrualRequest,
  CreateApprovalRequestRequest,
  CreateCarrierRequest,
  CreateContractRequest,
  CreateDepartmentRequest,
  CreateDimensionRequest,
  CreateEmployeeRequest,
  CreateFxRateRequest,
  CreateJobPositionRequest,
  CreateJournalRequest,
  CreateLeaveRequestRequest,
  CreateLeaveTypeRequest,
  CreateMessageRequest,
  CreatePaymentTermRequest,
  CreatePayrollRunRequest,
  CreateProjectMilestoneRequest,
  CreateProjectRequest,
  CreateProjectTaskRequest,
  CreateSalaryRuleRequest,
  CreateTaxRequest,
  CreateTaxYearRequest,
  CreateTimesheetRequest,
  CreateUnitCategoryRequest,
  CreateUnitRequest,
  Currency,
  DecideApprovalRequestRequest,
  Department,
  Dimension,
  Employee,
  EmploymentContract,
  FinanceKpi,
  FxRate,
  FxRevaluation,
  InventoryKpi,
  InventoryRatioKpi,
  InventoryValueRow,
  JobPosition,
  Journal,
  LeadToCashReport,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  ListQuery,
  ManufacturingKpi,
  Message,
  PaymentSplit,
  PaymentTerm,
  PayPayrollRunRequest,
  PayrollKpi,
  PayrollRun,
  Payslip,
  PipelineKpi,
  ProcurementKpi,
  ProfitAndLoss,
  Project,
  ProjectKpi,
  ProjectMilestone,
  ProjectSummary,
  ProjectTask,
  ReportQuery,
  ResolveFxRateRequest,
  ResolveFxRateResponse,
  RevaluationResult,
  RevalueRequest,
  ReverseAccrualsRequest,
  SalaryRule,
  SalesKpi,
  SetMilestoneReachedRequest,
  SetProjectStateRequest,
  SplitPaymentTermRequest,
  SubscriptionKpi,
  SuccessEnvelope,
  Tax,
  TaxYear,
  Timesheet,
  TrialBalance,
  Unit,
  UnitCategory,
  UpdateAccountRequest,
  UpdateCarrierRequest,
  UpdateContractRequest,
  UpdateDimensionRequest,
  UpdateEmployeeRequest,
  UpdateFxRateRequest,
  UpdatePaymentTermRequest,
  UpdateProjectRequest,
  UpdateProjectTaskRequest,
  UpdateSalaryRuleRequest,
  UpdateTaxRequest,
  UpdateTaxYearRequest,
  UpdateUnitRequest,
  UploadAttachmentRequest,
  YearEndRollRequest,
  YearEndRollResult,
} from "./types";
import { withListItems, withListMeta } from "./types";

export class Departments {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ departments: Department[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ departments: Department[] }>>(
      endpoints.departments.list(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async get(organizationId: number, id: number): Promise<{ department: Department }> {
    const response = await this.axios.get<SuccessEnvelope<{ department: Department }>>(
      endpoints.departments.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(
    organizationId: number,
    body: CreateDepartmentRequest,
  ): Promise<{ department: Department }> {
    const response = await this.axios.post<SuccessEnvelope<{ department: Department }>>(
      endpoints.departments.create(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }

  async update(
    organizationId: number,
    id: number,
    body: Partial<CreateDepartmentRequest>,
  ): Promise<{ department: Department }> {
    const response = await this.axios.put<SuccessEnvelope<{ department: Department }>>(
      endpoints.departments.update(String(organizationId), String(id)),
      body,
    );
    return withListMeta(response.data);
  }

  async delete(organizationId: number, id: number): Promise<void> {
    await this.axios.delete(endpoints.departments.delete(String(organizationId), String(id)));
  }
}

export class JobPositions {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ jobPositions: JobPosition[] }> {
    const response = await this.axios.get<SuccessEnvelope<JobPosition[]>>(
      endpoints.jobPositions.list(String(organizationId)),
      { params },
    );
    return withListItems(response.data, "jobPositions");
  }

  async get(organizationId: number, id: number): Promise<JobPosition> {
    const response = await this.axios.get<SuccessEnvelope<JobPosition>>(
      endpoints.jobPositions.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(organizationId: number, body: CreateJobPositionRequest): Promise<JobPosition> {
    const response = await this.axios.post<SuccessEnvelope<JobPosition>>(
      endpoints.jobPositions.create(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }

  async update(
    organizationId: number,
    id: number,
    body: Partial<CreateJobPositionRequest>,
  ): Promise<JobPosition> {
    const response = await this.axios.put<SuccessEnvelope<JobPosition>>(
      endpoints.jobPositions.update(String(organizationId), String(id)),
      body,
    );
    return withListMeta(response.data);
  }

  async delete(organizationId: number, id: number): Promise<void> {
    await this.axios.delete(endpoints.jobPositions.delete(String(organizationId), String(id)));
  }
}

export class LeaveTypes {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ leaveTypes: LeaveType[] }> {
    const response = await this.axios.get<SuccessEnvelope<LeaveType[]>>(
      endpoints.leaveTypes.list(String(organizationId)),
      { params },
    );
    return withListItems(response.data, "leaveTypes");
  }

  async get(organizationId: number, id: number): Promise<LeaveType> {
    const response = await this.axios.get<SuccessEnvelope<LeaveType>>(
      endpoints.leaveTypes.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(organizationId: number, body: CreateLeaveTypeRequest): Promise<LeaveType> {
    const response = await this.axios.post<SuccessEnvelope<LeaveType>>(
      endpoints.leaveTypes.create(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }

  async update(
    organizationId: number,
    id: number,
    body: Partial<CreateLeaveTypeRequest>,
  ): Promise<LeaveType> {
    const response = await this.axios.put<SuccessEnvelope<LeaveType>>(
      endpoints.leaveTypes.update(String(organizationId), String(id)),
      body,
    );
    return withListMeta(response.data);
  }

  async delete(organizationId: number, id: number): Promise<void> {
    await this.axios.delete(endpoints.leaveTypes.delete(String(organizationId), String(id)));
  }
}

export class Employees {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ employees: Employee[] }> {
    const response = await this.axios.get<SuccessEnvelope<Employee[]>>(
      endpoints.employees.list(String(organizationId)),
      { params },
    );
    return withListItems(response.data, "employees");
  }

  async get(organizationId: number, id: number): Promise<Employee> {
    const response = await this.axios.get<SuccessEnvelope<Employee>>(
      endpoints.employees.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(organizationId: number, body: CreateEmployeeRequest): Promise<Employee> {
    const response = await this.axios.post<SuccessEnvelope<Employee>>(
      endpoints.employees.create(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }

  async update(organizationId: number, id: number, body: UpdateEmployeeRequest): Promise<Employee> {
    const response = await this.axios.put<SuccessEnvelope<Employee>>(
      endpoints.employees.update(String(organizationId), String(id)),
      body,
    );
    return withListMeta(response.data);
  }

  async delete(organizationId: number, id: number): Promise<void> {
    await this.axios.delete(endpoints.employees.delete(String(organizationId), String(id)));
  }
}

export class Contracts {
  constructor(private readonly axios: AxiosInstance) {}

  async list(
    organizationId: number,
    params?: ListQuery,
  ): Promise<{ contracts: EmploymentContract[] }> {
    const response = await this.axios.get<SuccessEnvelope<EmploymentContract[]>>(
      endpoints.contracts.list(String(organizationId)),
      { params },
    );
    return withListItems(response.data, "contracts");
  }

  async get(organizationId: number, id: number): Promise<EmploymentContract> {
    const response = await this.axios.get<SuccessEnvelope<EmploymentContract>>(
      endpoints.contracts.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(organizationId: number, body: CreateContractRequest): Promise<EmploymentContract> {
    const response = await this.axios.post<SuccessEnvelope<EmploymentContract>>(
      endpoints.contracts.create(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }

  async update(
    organizationId: number,
    id: number,
    body: UpdateContractRequest,
  ): Promise<EmploymentContract> {
    const response = await this.axios.put<SuccessEnvelope<EmploymentContract>>(
      endpoints.contracts.update(String(organizationId), String(id)),
      body,
    );
    return withListMeta(response.data);
  }

  async terminate(organizationId: number, id: number): Promise<EmploymentContract> {
    const response = await this.axios.post<SuccessEnvelope<EmploymentContract>>(
      endpoints.contracts.terminate(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }
}

export class LeaveRequests {
  constructor(private readonly axios: AxiosInstance) {}

  async list(
    organizationId: number,
    params?: ListQuery,
  ): Promise<{ leaveRequests: LeaveRequest[] }> {
    const response = await this.axios.get<SuccessEnvelope<LeaveRequest[]>>(
      endpoints.leaveRequests.list(String(organizationId)),
      { params },
    );
    return withListItems(response.data, "leaveRequests");
  }

  async get(organizationId: number, id: number): Promise<LeaveRequest> {
    const response = await this.axios.get<SuccessEnvelope<LeaveRequest>>(
      endpoints.leaveRequests.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(organizationId: number, body: CreateLeaveRequestRequest): Promise<LeaveRequest> {
    const response = await this.axios.post<SuccessEnvelope<LeaveRequest>>(
      endpoints.leaveRequests.create(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }

  async submit(organizationId: number, id: number): Promise<LeaveRequest> {
    const response = await this.axios.post<SuccessEnvelope<LeaveRequest>>(
      endpoints.leaveRequests.submit(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async approve(organizationId: number, id: number): Promise<LeaveRequest> {
    const response = await this.axios.post<SuccessEnvelope<LeaveRequest>>(
      endpoints.leaveRequests.approve(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async refuse(organizationId: number, id: number): Promise<LeaveRequest> {
    const response = await this.axios.post<SuccessEnvelope<LeaveRequest>>(
      endpoints.leaveRequests.refuse(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async balance(
    organizationId: number,
    employeeId: number,
    leaveTypeId: number,
  ): Promise<{ balance: LeaveBalance }> {
    const response = await this.axios.get<SuccessEnvelope<{ balance: LeaveBalance }>>(
      endpoints.leaveRequests.balance(
        String(organizationId),
        String(employeeId),
        String(leaveTypeId),
      ),
    );
    return withListMeta(response.data);
  }
}

export class Attendances {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ attendances: Attendance[] }> {
    const response = await this.axios.get<SuccessEnvelope<Attendance[]>>(
      endpoints.attendances.list(String(organizationId)),
      { params },
    );
    return withListItems(response.data, "attendances");
  }

  async get(organizationId: number, id: number): Promise<Attendance> {
    const response = await this.axios.get<SuccessEnvelope<Attendance>>(
      endpoints.attendances.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async checkIn(organizationId: number, body: CheckInRequest): Promise<Attendance> {
    const response = await this.axios.post<SuccessEnvelope<Attendance>>(
      endpoints.attendances.checkIn(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }

  async checkOut(organizationId: number, id: number, body: CheckOutRequest): Promise<Attendance> {
    const response = await this.axios.post<SuccessEnvelope<Attendance>>(
      endpoints.attendances.checkOut(String(organizationId), String(id)),
      body,
    );
    return withListMeta(response.data);
  }
}

export class Timesheets {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ timesheets: Timesheet[] }> {
    const response = await this.axios.get<SuccessEnvelope<Timesheet[]>>(
      endpoints.timesheets.list(String(organizationId)),
      { params },
    );
    return withListItems(response.data, "timesheets");
  }

  async get(organizationId: number, id: number): Promise<Timesheet> {
    const response = await this.axios.get<SuccessEnvelope<Timesheet>>(
      endpoints.timesheets.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(organizationId: number, body: CreateTimesheetRequest): Promise<Timesheet> {
    const response = await this.axios.post<SuccessEnvelope<Timesheet>>(
      endpoints.timesheets.create(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }

  async delete(organizationId: number, id: number): Promise<void> {
    await this.axios.delete(endpoints.timesheets.delete(String(organizationId), String(id)));
  }
}

export class SalaryRules {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ salaryRules: SalaryRule[] }> {
    const response = await this.axios.get<SuccessEnvelope<SalaryRule[]>>(
      endpoints.salaryRules.list(String(organizationId)),
      { params },
    );
    return withListItems(response.data, "salaryRules");
  }

  async get(organizationId: number, id: number): Promise<SalaryRule> {
    const response = await this.axios.get<SuccessEnvelope<SalaryRule>>(
      endpoints.salaryRules.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(organizationId: number, body: CreateSalaryRuleRequest): Promise<SalaryRule> {
    const response = await this.axios.post<SuccessEnvelope<SalaryRule>>(
      endpoints.salaryRules.create(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }

  async update(
    organizationId: number,
    id: number,
    body: UpdateSalaryRuleRequest,
  ): Promise<SalaryRule> {
    const response = await this.axios.put<SuccessEnvelope<SalaryRule>>(
      endpoints.salaryRules.update(String(organizationId), String(id)),
      body,
    );
    return withListMeta(response.data);
  }

  async delete(organizationId: number, id: number): Promise<void> {
    await this.axios.delete(endpoints.salaryRules.delete(String(organizationId), String(id)));
  }
}

export class PayrollRuns {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ payrollRuns: PayrollRun[] }> {
    const response = await this.axios.get<SuccessEnvelope<PayrollRun[]>>(
      endpoints.payrollRuns.list(String(organizationId)),
      { params },
    );
    return withListItems(response.data, "payrollRuns");
  }

  async create(organizationId: number, body: CreatePayrollRunRequest): Promise<PayrollRun> {
    const response = await this.axios.post<SuccessEnvelope<PayrollRun>>(
      endpoints.payrollRuns.create(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }

  async get(organizationId: number, id: number): Promise<{ run: PayrollRun; payslips: Payslip[] }> {
    const response = await this.axios.get<
      SuccessEnvelope<{ run: PayrollRun; payslips: Payslip[] }>
    >(endpoints.payrollRuns.get(String(organizationId), String(id)));
    return withListMeta(response.data);
  }

  async confirm(
    organizationId: number,
    id: number,
    body: ConfirmPayrollRunRequest,
  ): Promise<PayrollRun> {
    const response = await this.axios.post<SuccessEnvelope<PayrollRun>>(
      endpoints.payrollRuns.confirm(String(organizationId), String(id)),
      body,
    );
    return withListMeta(response.data);
  }

  async pay(organizationId: number, id: number, body: PayPayrollRunRequest): Promise<PayrollRun> {
    const response = await this.axios.post<SuccessEnvelope<PayrollRun>>(
      endpoints.payrollRuns.pay(String(organizationId), String(id)),
      body,
    );
    return withListMeta(response.data);
  }

  async close(organizationId: number, id: number): Promise<PayrollRun> {
    const response = await this.axios.post<SuccessEnvelope<PayrollRun>>(
      endpoints.payrollRuns.close(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }
}

export class Payslips {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ payslips: Payslip[] }> {
    const response = await this.axios.get<SuccessEnvelope<Payslip[]>>(
      endpoints.payslips.list(String(organizationId)),
      { params },
    );
    return withListItems(response.data, "payslips");
  }

  async get(organizationId: number, id: number): Promise<Payslip> {
    const response = await this.axios.get<SuccessEnvelope<Payslip>>(
      endpoints.payslips.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }
}

export class Projects {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ projects: Project[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ projects: Project[] }>>(
      endpoints.projects.list(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async get(organizationId: number, id: number): Promise<{ project: Project }> {
    const response = await this.axios.get<SuccessEnvelope<{ project: Project }>>(
      endpoints.projects.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(organizationId: number, body: CreateProjectRequest): Promise<{ project: Project }> {
    const response = await this.axios.post<SuccessEnvelope<{ project: Project }>>(
      endpoints.projects.create(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }

  async update(
    organizationId: number,
    id: number,
    body: UpdateProjectRequest,
  ): Promise<{ project: Project }> {
    const response = await this.axios.put<SuccessEnvelope<{ project: Project }>>(
      endpoints.projects.update(String(organizationId), String(id)),
      body,
    );
    return withListMeta(response.data);
  }

  async state(
    organizationId: number,
    id: number,
    body: SetProjectStateRequest,
  ): Promise<{ project: Project }> {
    const response = await this.axios.post<SuccessEnvelope<{ project: Project }>>(
      endpoints.projects.state(String(organizationId), String(id)),
      body,
    );
    return withListMeta(response.data);
  }

  async summary(organizationId: number, id: number): Promise<ProjectSummary> {
    const response = await this.axios.get<SuccessEnvelope<ProjectSummary>>(
      endpoints.projects.summary(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async bill(
    organizationId: number,
    id: number,
    body: BillTimeMaterialRequest,
  ): Promise<{ invoiceId: number; name: string; amountTotal: number }> {
    const response = await this.axios.post<
      SuccessEnvelope<{ invoiceId: number; name: string; amountTotal: number }>
    >(endpoints.projects.bill(String(organizationId), String(id)), body);
    return withListMeta(response.data);
  }

  tasks = {
    list: async (
      organizationId: number,
      projectId: number,
      params?: ListQuery,
    ): Promise<{ tasks: ProjectTask[] }> => {
      const response = await this.axios.get<SuccessEnvelope<{ tasks: ProjectTask[] }>>(
        endpoints.projects.tasks.list(String(organizationId), String(projectId)),
        {
          params,
        },
      );
      return withListMeta(response.data);
    },
    create: async (
      organizationId: number,
      projectId: number,
      body: CreateProjectTaskRequest,
    ): Promise<{ task: ProjectTask }> => {
      const response = await this.axios.post<SuccessEnvelope<{ task: ProjectTask }>>(
        endpoints.projects.tasks.create(String(organizationId), String(projectId)),
        body,
      );
      return withListMeta(response.data);
    },
    update: async (
      organizationId: number,
      projectId: number,
      taskId: number,
      body: UpdateProjectTaskRequest,
    ): Promise<{ task: ProjectTask }> => {
      const response = await this.axios.put<SuccessEnvelope<{ task: ProjectTask }>>(
        endpoints.projects.tasks.update(String(organizationId), String(projectId), String(taskId)),
        body,
      );
      return withListMeta(response.data);
    },
  };

  milestones = {
    list: async (
      organizationId: number,
      projectId: number,
      params?: ListQuery,
    ): Promise<{ milestones: ProjectMilestone[] }> => {
      const response = await this.axios.get<SuccessEnvelope<{ milestones: ProjectMilestone[] }>>(
        endpoints.projects.milestones.list(String(organizationId), String(projectId)),
        { params },
      );
      return withListMeta(response.data);
    },
    create: async (
      organizationId: number,
      projectId: number,
      body: CreateProjectMilestoneRequest,
    ): Promise<{ milestone: ProjectMilestone }> => {
      const response = await this.axios.post<SuccessEnvelope<{ milestone: ProjectMilestone }>>(
        endpoints.projects.milestones.create(String(organizationId), String(projectId)),
        body,
      );
      return withListMeta(response.data);
    },
    reached: async (
      organizationId: number,
      projectId: number,
      milestoneId: number,
      body: SetMilestoneReachedRequest,
    ): Promise<{ milestone: ProjectMilestone }> => {
      const response = await this.axios.post<SuccessEnvelope<{ milestone: ProjectMilestone }>>(
        endpoints.projects.milestones.reached(
          String(organizationId),
          String(projectId),
          String(milestoneId),
        ),
        body,
      );
      return withListMeta(response.data);
    },
  };
}

export class FxRates {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ fxRates: FxRate[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ fxRates: FxRate[] }>>(
      endpoints.fxRates.list(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async get(organizationId: number, id: number): Promise<{ fxRate: FxRate }> {
    const response = await this.axios.get<SuccessEnvelope<{ fxRate: FxRate }>>(
      endpoints.fxRates.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(organizationId: number, request: CreateFxRateRequest): Promise<{ fxRate: FxRate }> {
    const response = await this.axios.post<SuccessEnvelope<{ fxRate: FxRate }>>(
      endpoints.fxRates.create(String(organizationId)),
      request,
    );
    return withListMeta(response.data);
  }

  async update(
    organizationId: number,
    id: number,
    request: UpdateFxRateRequest,
  ): Promise<{ fxRate: FxRate }> {
    const response = await this.axios.put<SuccessEnvelope<{ fxRate: FxRate }>>(
      endpoints.fxRates.update(String(organizationId), String(id)),
      request,
    );
    return withListMeta(response.data);
  }

  async delete(organizationId: number, id: number): Promise<void> {
    await this.axios.delete(endpoints.fxRates.delete(String(organizationId), String(id)));
  }

  async resolve(
    organizationId: number,
    request: ResolveFxRateRequest,
  ): Promise<ResolveFxRateResponse> {
    const response = await this.axios.post<SuccessEnvelope<ResolveFxRateResponse>>(
      endpoints.fxRates.resolve(String(organizationId)),
      request,
    );
    return withListMeta(response.data);
  }
}

export class Currencies {
  constructor(private readonly axios: AxiosInstance) {}

  async list(params?: ListQuery): Promise<{ currencies: Currency[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ currencies: Currency[] }>>(
      endpoints.currencies.list,
      { params },
    );
    return withListMeta(response.data);
  }

  async get(code: string): Promise<{ currency: Currency }> {
    const response = await this.axios.get<SuccessEnvelope<{ currency: Currency }>>(
      endpoints.currencies.get(code),
    );
    return withListMeta(response.data);
  }
}

export class Countries {
  constructor(private readonly axios: AxiosInstance) {}

  async list(params?: ListQuery): Promise<{ countries: Country[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ countries: Country[] }>>(
      endpoints.countries.list,
      { params },
    );
    return withListMeta(response.data);
  }

  async get(code: string): Promise<{ country: Country }> {
    const response = await this.axios.get<SuccessEnvelope<{ country: Country }>>(
      endpoints.countries.get(code),
    );
    return withListMeta(response.data);
  }
}

export class UnitCategories {
  constructor(private readonly axios: AxiosInstance) {}

  async list(params?: ListQuery): Promise<{ categories: UnitCategory[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ categories: UnitCategory[] }>>(
      endpoints.unitGroups.list,
      { params },
    );
    return withListMeta(response.data);
  }

  async get(id: number): Promise<{ category: UnitCategory }> {
    const response = await this.axios.get<SuccessEnvelope<{ category: UnitCategory }>>(
      endpoints.unitGroups.get(String(id)),
    );
    return withListMeta(response.data);
  }

  async create(request: CreateUnitCategoryRequest): Promise<{ category: UnitCategory }> {
    const response = await this.axios.post<SuccessEnvelope<{ category: UnitCategory }>>(
      endpoints.unitGroups.create,
      request,
    );
    return withListMeta(response.data);
  }

  async update(
    id: number,
    request: CreateUnitCategoryRequest,
  ): Promise<{ category: UnitCategory }> {
    const response = await this.axios.put<SuccessEnvelope<{ category: UnitCategory }>>(
      endpoints.unitGroups.update(String(id)),
      request,
    );
    return withListMeta(response.data);
  }

  async delete(id: number): Promise<void> {
    await this.axios.delete(endpoints.unitGroups.delete(String(id)));
  }
}

export class Units {
  constructor(private readonly axios: AxiosInstance) {}

  async list(params?: ListQuery): Promise<{ units: Unit[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ units: Unit[] }>>(
      endpoints.units.list,
      {
        params,
      },
    );
    return withListMeta(response.data);
  }

  async get(id: number): Promise<{ unit: Unit }> {
    const response = await this.axios.get<SuccessEnvelope<{ unit: Unit }>>(
      endpoints.units.get(String(id)),
    );
    return withListMeta(response.data);
  }

  async create(request: CreateUnitRequest): Promise<{ unit: Unit }> {
    const response = await this.axios.post<SuccessEnvelope<{ unit: Unit }>>(
      endpoints.units.create,
      request,
    );
    return withListMeta(response.data);
  }

  async update(id: number, request: UpdateUnitRequest): Promise<{ unit: Unit }> {
    const response = await this.axios.put<SuccessEnvelope<{ unit: Unit }>>(
      endpoints.units.update(String(id)),
      request,
    );
    return withListMeta(response.data);
  }

  async delete(id: number): Promise<void> {
    await this.axios.delete(endpoints.units.delete(String(id)));
  }

  async convert(request: ConvertUnitRequest): Promise<{ value: number }> {
    const response = await this.axios.post<SuccessEnvelope<{ value: number }>>(
      endpoints.units.convert,
      request,
    );
    return withListMeta(response.data);
  }
}

export class Dimensions {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ accounts: Dimension[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ accounts: Dimension[] }>>(
      endpoints.dimensions.list(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async get(organizationId: number, id: number): Promise<{ account: Dimension }> {
    const response = await this.axios.get<SuccessEnvelope<{ account: Dimension }>>(
      endpoints.dimensions.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(
    organizationId: number,
    request: CreateDimensionRequest,
  ): Promise<{ account: Dimension }> {
    const response = await this.axios.post<SuccessEnvelope<{ account: Dimension }>>(
      endpoints.dimensions.create(String(organizationId)),
      request,
    );
    return withListMeta(response.data);
  }

  async update(
    organizationId: number,
    id: number,
    request: UpdateDimensionRequest,
  ): Promise<{ account: Dimension }> {
    const response = await this.axios.put<SuccessEnvelope<{ account: Dimension }>>(
      endpoints.dimensions.update(String(organizationId), String(id)),
      request,
    );
    return withListMeta(response.data);
  }

  async delete(organizationId: number, id: number): Promise<void> {
    await this.axios.delete(endpoints.dimensions.delete(String(organizationId), String(id)));
  }
}

export class PaymentTerms {
  constructor(private readonly axios: AxiosInstance) {}

  async list(params?: ListQuery): Promise<{ paymentTerms: PaymentTerm[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ paymentTerms: PaymentTerm[] }>>(
      endpoints.paymentTerms.list,
      { params },
    );
    return withListMeta(response.data);
  }

  async get(id: number): Promise<{ paymentTerm: PaymentTerm }> {
    const response = await this.axios.get<SuccessEnvelope<{ paymentTerm: PaymentTerm }>>(
      endpoints.paymentTerms.get(String(id)),
    );
    return withListMeta(response.data);
  }

  async create(request: CreatePaymentTermRequest): Promise<{ paymentTerm: PaymentTerm }> {
    const response = await this.axios.post<SuccessEnvelope<{ paymentTerm: PaymentTerm }>>(
      endpoints.paymentTerms.create,
      request,
    );
    return withListMeta(response.data);
  }

  async update(
    id: number,
    request: UpdatePaymentTermRequest,
  ): Promise<{ paymentTerm: PaymentTerm }> {
    const response = await this.axios.put<SuccessEnvelope<{ paymentTerm: PaymentTerm }>>(
      endpoints.paymentTerms.update(String(id)),
      request,
    );
    return withListMeta(response.data);
  }

  async delete(id: number): Promise<void> {
    await this.axios.delete(endpoints.paymentTerms.delete(String(id)));
  }

  async splits(id: number, request: SplitPaymentTermRequest): Promise<{ splits: PaymentSplit[] }> {
    const response = await this.axios.post<SuccessEnvelope<{ splits: PaymentSplit[] }>>(
      endpoints.paymentTerms.splits(String(id)),
      request,
    );
    return withListMeta(response.data);
  }
}

export class Accounts {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ accounts: Account[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ accounts: Account[] }>>(
      endpoints.accounts.list(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async get(organizationId: number, id: number): Promise<{ account: Account }> {
    const response = await this.axios.get<SuccessEnvelope<{ account: Account }>>(
      endpoints.accounts.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(
    organizationId: number,
    request: CreateAccountRequest,
  ): Promise<{ account: Account }> {
    const response = await this.axios.post<SuccessEnvelope<{ account: Account }>>(
      endpoints.accounts.create(String(organizationId)),
      request,
    );
    return withListMeta(response.data);
  }

  async update(
    organizationId: number,
    id: number,
    request: UpdateAccountRequest,
  ): Promise<{ account: Account }> {
    const response = await this.axios.put<SuccessEnvelope<{ account: Account }>>(
      endpoints.accounts.update(String(organizationId), String(id)),
      request,
    );
    return withListMeta(response.data);
  }

  async delete(organizationId: number, id: number): Promise<void> {
    await this.axios.delete(endpoints.accounts.delete(String(organizationId), String(id)));
  }
}

export class Journals {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ journals: Journal[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ journals: Journal[] }>>(
      endpoints.journals.list(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async get(organizationId: number, id: number): Promise<{ journal: Journal }> {
    const response = await this.axios.get<SuccessEnvelope<{ journal: Journal }>>(
      endpoints.journals.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(
    organizationId: number,
    request: CreateJournalRequest,
  ): Promise<{ journal: Journal }> {
    const response = await this.axios.post<SuccessEnvelope<{ journal: Journal }>>(
      endpoints.journals.create(String(organizationId)),
      request,
    );
    return withListMeta(response.data);
  }

  async update(
    organizationId: number,
    id: number,
    request: Partial<CreateJournalRequest>,
  ): Promise<{ journal: Journal }> {
    const response = await this.axios.put<SuccessEnvelope<{ journal: Journal }>>(
      endpoints.journals.update(String(organizationId), String(id)),
      request,
    );
    return withListMeta(response.data);
  }

  async delete(organizationId: number, id: number): Promise<void> {
    await this.axios.delete(endpoints.journals.delete(String(organizationId), String(id)));
  }
}

export class Taxes {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ taxes: Tax[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ taxes: Tax[] }>>(
      endpoints.taxes.list(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async get(organizationId: number, id: number): Promise<{ tax: Tax }> {
    const response = await this.axios.get<SuccessEnvelope<{ tax: Tax }>>(
      endpoints.taxes.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(organizationId: number, request: CreateTaxRequest): Promise<{ tax: Tax }> {
    const response = await this.axios.post<SuccessEnvelope<{ tax: Tax }>>(
      endpoints.taxes.create(String(organizationId)),
      request,
    );
    return withListMeta(response.data);
  }

  async update(
    organizationId: number,
    id: number,
    request: UpdateTaxRequest,
  ): Promise<{ tax: Tax }> {
    const response = await this.axios.put<SuccessEnvelope<{ tax: Tax }>>(
      endpoints.taxes.update(String(organizationId), String(id)),
      request,
    );
    return withListMeta(response.data);
  }

  async delete(organizationId: number, id: number): Promise<void> {
    await this.axios.delete(endpoints.taxes.delete(String(organizationId), String(id)));
  }
}

export class TaxYears {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ taxYears: TaxYear[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ taxYears: TaxYear[] }>>(
      endpoints.taxYears.list(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async get(organizationId: number, id: number): Promise<{ taxYear: TaxYear }> {
    const response = await this.axios.get<SuccessEnvelope<{ taxYear: TaxYear }>>(
      endpoints.taxYears.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(
    organizationId: number,
    request: CreateTaxYearRequest,
  ): Promise<{ taxYear: TaxYear }> {
    const response = await this.axios.post<SuccessEnvelope<{ taxYear: TaxYear }>>(
      endpoints.taxYears.create(String(organizationId)),
      request,
    );
    return withListMeta(response.data);
  }

  async update(
    organizationId: number,
    id: number,
    request: UpdateTaxYearRequest,
  ): Promise<{ taxYear: TaxYear }> {
    const response = await this.axios.put<SuccessEnvelope<{ taxYear: TaxYear }>>(
      endpoints.taxYears.update(String(organizationId), String(id)),
      request,
    );
    return withListMeta(response.data);
  }

  async delete(organizationId: number, id: number): Promise<void> {
    await this.axios.delete(endpoints.taxYears.delete(String(organizationId), String(id)));
  }
}

export class Carriers {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ carriers: Carrier[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ carriers: Carrier[] }>>(
      endpoints.carriers.list(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async get(organizationId: number, id: number): Promise<{ carrier: Carrier }> {
    const response = await this.axios.get<SuccessEnvelope<{ carrier: Carrier }>>(
      endpoints.carriers.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async create(
    organizationId: number,
    request: CreateCarrierRequest,
  ): Promise<{ carrier: Carrier }> {
    const response = await this.axios.post<SuccessEnvelope<{ carrier: Carrier }>>(
      endpoints.carriers.create(String(organizationId)),
      request,
    );
    return withListMeta(response.data);
  }

  async update(
    organizationId: number,
    id: number,
    request: UpdateCarrierRequest,
  ): Promise<{ carrier: Carrier }> {
    const response = await this.axios.put<SuccessEnvelope<{ carrier: Carrier }>>(
      endpoints.carriers.update(String(organizationId), String(id)),
      request,
    );
    return withListMeta(response.data);
  }

  async delete(organizationId: number, id: number): Promise<void> {
    await this.axios.delete(endpoints.carriers.delete(String(organizationId), String(id)));
  }
}

export class Reports {
  constructor(private readonly axios: AxiosInstance) {}

  async trialBalance(organizationId: number, params?: ReportQuery): Promise<TrialBalance> {
    const response = await this.axios.get<SuccessEnvelope<TrialBalance>>(
      endpoints.reports.trialBalance(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async aging(
    organizationId: number,
    params?: ListQuery,
  ): Promise<{ asOf: string; rows: AgingRow[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ asOf: string; rows: AgingRow[] }>>(
      endpoints.reports.aging(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async inventoryValuation(
    organizationId: number,
    params?: ListQuery,
  ): Promise<{ rows: InventoryValueRow[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ rows: InventoryValueRow[] }>>(
      endpoints.reports.inventoryValuation(String(organizationId)),
      {
        params,
      },
    );
    return withListMeta(response.data);
  }

  async profitAndLoss(organizationId: number, params?: ReportQuery): Promise<ProfitAndLoss> {
    const response = await this.axios.get<SuccessEnvelope<ProfitAndLoss>>(
      endpoints.reports.profitAndLoss(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async balanceSheet(organizationId: number, params?: ReportQuery): Promise<BalanceSheet> {
    const response = await this.axios.get<SuccessEnvelope<BalanceSheet>>(
      endpoints.reports.balanceSheet(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async cashFlow(organizationId: number, params?: ReportQuery): Promise<CashFlow> {
    const response = await this.axios.get<SuccessEnvelope<CashFlow>>(
      endpoints.reports.cashFlow(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }
}

export class Kpis {
  constructor(private readonly axios: AxiosInstance) {}

  async sales(organizationId: number): Promise<SalesKpi> {
    const response = await this.axios.get<SuccessEnvelope<SalesKpi>>(
      endpoints.kpis.sales(String(organizationId)),
    );
    return withListMeta(response.data);
  }

  async pipeline(organizationId: number): Promise<PipelineKpi> {
    const response = await this.axios.get<SuccessEnvelope<PipelineKpi>>(
      endpoints.kpis.pipeline(String(organizationId)),
    );
    return withListMeta(response.data);
  }

  async leadToCash(organizationId: number): Promise<LeadToCashReport> {
    const response = await this.axios.get<SuccessEnvelope<LeadToCashReport>>(
      endpoints.kpis.leadToCash(String(organizationId)),
    );
    return withListMeta(response.data);
  }

  async inventory(organizationId: number): Promise<InventoryKpi> {
    const response = await this.axios.get<SuccessEnvelope<InventoryKpi>>(
      endpoints.kpis.inventory(String(organizationId)),
    );
    return withListMeta(response.data);
  }

  async subscription(organizationId: number): Promise<SubscriptionKpi> {
    const response = await this.axios.get<SuccessEnvelope<SubscriptionKpi>>(
      endpoints.kpis.subscription(String(organizationId)),
    );
    return withListMeta(response.data);
  }

  async projects(organizationId: number): Promise<ProjectKpi> {
    const response = await this.axios.get<SuccessEnvelope<ProjectKpi>>(
      endpoints.kpis.projects(String(organizationId)),
    );
    return withListMeta(response.data);
  }

  async payroll(organizationId: number): Promise<PayrollKpi> {
    const response = await this.axios.get<SuccessEnvelope<PayrollKpi>>(
      endpoints.kpis.payroll(String(organizationId)),
    );
    return withListMeta(response.data);
  }

  async finance(organizationId: number): Promise<FinanceKpi> {
    const response = await this.axios.get<SuccessEnvelope<FinanceKpi>>(
      endpoints.kpis.finance(String(organizationId)),
    );
    return withListMeta(response.data);
  }

  async procurement(organizationId: number): Promise<ProcurementKpi> {
    const response = await this.axios.get<SuccessEnvelope<ProcurementKpi>>(
      endpoints.kpis.procurement(String(organizationId)),
    );
    return withListMeta(response.data);
  }

  async manufacturing(organizationId: number): Promise<ManufacturingKpi> {
    const response = await this.axios.get<SuccessEnvelope<ManufacturingKpi>>(
      endpoints.kpis.manufacturing(String(organizationId)),
    );
    return withListMeta(response.data);
  }

  async arAp(organizationId: number): Promise<ArApKpi> {
    const response = await this.axios.get<SuccessEnvelope<ArApKpi>>(
      endpoints.kpis.arAp(String(organizationId)),
    );
    return withListMeta(response.data);
  }

  async cash(organizationId: number): Promise<CashKpi> {
    const response = await this.axios.get<SuccessEnvelope<CashKpi>>(
      endpoints.kpis.cash(String(organizationId)),
    );
    return withListMeta(response.data);
  }

  async inventoryRatio(organizationId: number): Promise<InventoryRatioKpi> {
    const response = await this.axios.get<SuccessEnvelope<InventoryRatioKpi>>(
      endpoints.kpis.inventoryRatio(String(organizationId)),
    );
    return withListMeta(response.data);
  }
}

export class FxRevaluations {
  constructor(private readonly axios: AxiosInstance) {}

  async list(
    organizationId: number,
    params?: ListQuery,
  ): Promise<{ revaluations: FxRevaluation[] }> {
    const response = await this.axios.get<SuccessEnvelope<FxRevaluation[]>>(
      endpoints.fxRevaluations.list(String(organizationId)),
      { params },
    );
    return withListItems(response.data, "revaluations");
  }

  async create(organizationId: number, body: RevalueRequest): Promise<RevaluationResult> {
    const response = await this.axios.post<SuccessEnvelope<RevaluationResult>>(
      endpoints.fxRevaluations.create(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }
}

export class Accruals {
  constructor(private readonly axios: AxiosInstance) {}

  async list(organizationId: number, params?: ListQuery): Promise<{ accruals: Accrual[] }> {
    const response = await this.axios.get<SuccessEnvelope<Accrual[]>>(
      endpoints.accruals.list(String(organizationId)),
      { params },
    );
    return withListItems(response.data, "accruals");
  }

  async create(organizationId: number, body: CreateAccrualRequest): Promise<AccrualResult> {
    const response = await this.axios.post<SuccessEnvelope<AccrualResult>>(
      endpoints.accruals.create(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }

  async reverseDue(
    organizationId: number,
    body: ReverseAccrualsRequest,
  ): Promise<{ reversed: number }> {
    const response = await this.axios.post<SuccessEnvelope<{ reversed: number }>>(
      endpoints.accruals.reverseDue(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }
}

export class PeriodClose {
  constructor(private readonly axios: AxiosInstance) {}

  async close(organizationId: number, body: ClosePeriodRequest): Promise<CloseResult> {
    const response = await this.axios.post<SuccessEnvelope<CloseResult>>(
      endpoints.periodClose.close(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }

  async yearEndRoll(organizationId: number, body: YearEndRollRequest): Promise<YearEndRollResult> {
    const response = await this.axios.post<SuccessEnvelope<YearEndRollResult>>(
      endpoints.periodClose.yearEndRoll(String(organizationId)),
      body,
    );
    return withListMeta(response.data);
  }
}

export type HealthStatus = {
  status: string;
  service: string;
  time: string;
};

export class Health {
  constructor(private readonly axios: AxiosInstance) {}

  async check(): Promise<HealthStatus> {
    const response = await this.axios.get<SuccessEnvelope<HealthStatus>>(endpoints.health);
    return withListMeta(response.data);
  }
}

export class ApprovalRequests {
  constructor(private readonly axios: AxiosInstance) {}

  async list(
    organizationId: number,
    params?: ListQuery,
  ): Promise<{ approvalRequests: ApprovalRequest[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ approvalRequests: ApprovalRequest[] }>>(
      endpoints.approvalRequests.list(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async create(
    organizationId: number,
    request: CreateApprovalRequestRequest,
  ): Promise<{ approvalRequest: ApprovalRequest }> {
    const response = await this.axios.post<SuccessEnvelope<{ approvalRequest: ApprovalRequest }>>(
      endpoints.approvalRequests.create(String(organizationId)),
      request,
    );
    return withListMeta(response.data);
  }

  async get(organizationId: number, id: number): Promise<{ approvalRequest: ApprovalRequest }> {
    const response = await this.axios.get<SuccessEnvelope<{ approvalRequest: ApprovalRequest }>>(
      endpoints.approvalRequests.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async decide(
    organizationId: number,
    id: number,
    request: DecideApprovalRequestRequest,
  ): Promise<{ approvalRequest: ApprovalRequest }> {
    const response = await this.axios.post<SuccessEnvelope<{ approvalRequest: ApprovalRequest }>>(
      endpoints.approvalRequests.decide(String(organizationId), String(id)),
      request,
    );
    return withListMeta(response.data);
  }
}

export class Attachments {
  constructor(private readonly axios: AxiosInstance) {}

  async list(
    organizationId: number,
    params?: ListQuery & { ownerType?: string; ownerId?: number },
  ): Promise<{ attachments: Attachment[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ attachments: Attachment[] }>>(
      endpoints.attachments.list(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async upload(
    organizationId: number,
    request: UploadAttachmentRequest,
  ): Promise<{ attachment: Attachment }> {
    const form = new FormData();
    form.append("owner_type", request.ownerType);
    form.append("owner_id", String(request.ownerId));
    form.append("file", request.file);
    const response = await this.axios.post<SuccessEnvelope<{ attachment: Attachment }>>(
      endpoints.attachments.upload(String(organizationId)),
      form,
    );
    return withListMeta(response.data);
  }

  async get(organizationId: number, id: number): Promise<{ attachment: Attachment }> {
    const response = await this.axios.get<SuccessEnvelope<{ attachment: Attachment }>>(
      endpoints.attachments.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }

  async download(organizationId: number, id: number): Promise<Blob> {
    const response = await this.axios.get(
      endpoints.attachments.download(String(organizationId), String(id)),
      { responseType: "blob" },
    );
    return response.data;
  }

  async delete(organizationId: number, id: number): Promise<void> {
    await this.axios.delete(endpoints.attachments.delete(String(organizationId), String(id)));
  }
}

export class Messages {
  constructor(private readonly axios: AxiosInstance) {}

  async list(
    organizationId: number,
    params?: ListQuery & { ownerType?: string; ownerId?: number },
  ): Promise<{ messages: Message[] }> {
    const response = await this.axios.get<SuccessEnvelope<{ messages: Message[] }>>(
      endpoints.messages.list(String(organizationId)),
      { params },
    );
    return withListMeta(response.data);
  }

  async create(
    organizationId: number,
    request: CreateMessageRequest,
  ): Promise<{ message: Message }> {
    const response = await this.axios.post<SuccessEnvelope<{ message: Message }>>(
      endpoints.messages.create(String(organizationId)),
      request,
    );
    return withListMeta(response.data);
  }

  async get(organizationId: number, id: number): Promise<{ message: Message }> {
    const response = await this.axios.get<SuccessEnvelope<{ message: Message }>>(
      endpoints.messages.get(String(organizationId), String(id)),
    );
    return withListMeta(response.data);
  }
}
