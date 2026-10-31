"use client";

import type {
  ArApKpi,
  CashKpi,
  FinanceKpi,
  InventoryKpi,
  InventoryRatioKpi,
  LeadToCashReport,
  ManufacturingKpi,
  PayrollKpi,
  PipelineKpi,
  ProcurementKpi,
  ProjectKpi,
  SalesKpi,
  SubscriptionKpi,
} from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { useOrgListQuery } from "./use-org-query";

export function useFinanceKpi() {
  return useOrgListQuery<FinanceKpi, Record<string, never>>("financeKpi", (organizationId) =>
    getSwantaraService().kpis.finance(organizationId),
  );
}

export function usePayrollKpi() {
  return useOrgListQuery<PayrollKpi, Record<string, never>>("payrollKpi", (organizationId) =>
    getSwantaraService().kpis.payroll(organizationId),
  );
}

export function useCashKpi() {
  return useOrgListQuery<CashKpi, Record<string, never>>("cashKpi", (organizationId) =>
    getSwantaraService().kpis.cash(organizationId),
  );
}

export function useSalesKpi() {
  return useOrgListQuery<SalesKpi, Record<string, never>>("salesKpi", (organizationId) =>
    getSwantaraService().kpis.sales(organizationId),
  );
}

export function usePipelineKpi() {
  return useOrgListQuery<PipelineKpi, Record<string, never>>("pipelineKpi", (organizationId) =>
    getSwantaraService().kpis.pipeline(organizationId),
  );
}

export function useInventoryKpi() {
  return useOrgListQuery<InventoryKpi, Record<string, never>>("inventoryKpi", (organizationId) =>
    getSwantaraService().kpis.inventory(organizationId),
  );
}

export function useLeadToCashKpi() {
  return useOrgListQuery<LeadToCashReport, Record<string, never>>(
    "leadToCashKpi",
    (organizationId) => getSwantaraService().kpis.leadToCash(organizationId),
  );
}

export function useSubscriptionKpi() {
  return useOrgListQuery<SubscriptionKpi, Record<string, never>>(
    "subscriptionKpi",
    (organizationId) => getSwantaraService().kpis.subscription(organizationId),
  );
}

export function useProjectKpi() {
  return useOrgListQuery<ProjectKpi, Record<string, never>>("projectKpi", (organizationId) =>
    getSwantaraService().kpis.projects(organizationId),
  );
}

export function useProcurementKpi() {
  return useOrgListQuery<ProcurementKpi, Record<string, never>>(
    "procurementKpi",
    (organizationId) => getSwantaraService().kpis.procurement(organizationId),
  );
}

export function useManufacturingKpi() {
  return useOrgListQuery<ManufacturingKpi, Record<string, never>>(
    "manufacturingKpi",
    (organizationId) => getSwantaraService().kpis.manufacturing(organizationId),
  );
}

export function useArApKpi() {
  return useOrgListQuery<ArApKpi, Record<string, never>>("arApKpi", (organizationId) =>
    getSwantaraService().kpis.arAp(organizationId),
  );
}

export function useInventoryRatioKpi() {
  return useOrgListQuery<InventoryRatioKpi, Record<string, never>>(
    "inventoryRatioKpi",
    (organizationId) => getSwantaraService().kpis.inventoryRatio(organizationId),
  );
}
