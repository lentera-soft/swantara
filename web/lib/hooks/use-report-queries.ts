"use client";

import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  AgingRow,
  BalanceSheet,
  CashFlow,
  InventoryValueRow,
  ProfitAndLoss,
  ReportQuery,
  TaxPeriod,
  TrialBalance,
} from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { useOrgListQuery } from "./use-org-query";

type ReportOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData>,
  "queryKey" | "queryFn" | "enabled"
> & { enabled?: boolean };

export function useTrialBalance(params?: ReportQuery, options?: ReportOptions<TrialBalance>) {
  return useOrgListQuery<TrialBalance, ReportQuery>(
    "trialBalance",
    (organizationId, p) => getSwantaraService().reports.trialBalance(organizationId, p),
    params,
    options,
  );
}

export function useAgingReport() {
  return useOrgListQuery<{ asOf: string; rows: AgingRow[] }, Record<string, never>>(
    "agingReport",
    (organizationId) => getSwantaraService().reports.aging(organizationId),
  );
}

export function useInventoryValuation() {
  return useOrgListQuery<{ rows: InventoryValueRow[] }, Record<string, never>>(
    "inventoryValuation",
    (organizationId) => getSwantaraService().reports.inventoryValuation(organizationId),
  );
}

export function useProfitAndLoss(params?: ReportQuery, options?: ReportOptions<ProfitAndLoss>) {
  return useOrgListQuery<ProfitAndLoss, ReportQuery>(
    "profitAndLoss",
    (organizationId, p) => getSwantaraService().reports.profitAndLoss(organizationId, p),
    params,
    options,
  );
}

export function useBalanceSheet(params?: ReportQuery, options?: ReportOptions<BalanceSheet>) {
  return useOrgListQuery<BalanceSheet, ReportQuery>(
    "balanceSheet",
    (organizationId, p) => getSwantaraService().reports.balanceSheet(organizationId, p),
    params,
    options,
  );
}

export function useCashFlowReport(params?: ReportQuery, options?: ReportOptions<CashFlow>) {
  return useOrgListQuery<CashFlow, ReportQuery>(
    "cashFlowReport",
    (organizationId, p) => getSwantaraService().reports.cashFlow(organizationId, p),
    params,
    options,
  );
}

export function useTaxPeriods() {
  return useOrgListQuery<{ taxPeriods: TaxPeriod[] }, Record<string, never>>(
    "taxPeriods",
    (organizationId) => getSwantaraService().taxPeriods.list(organizationId),
  );
}

function pickCurrentPeriod(periods: TaxPeriod[]): TaxPeriod | null {
  if (periods.length === 0) return null;
  const today = new Date();
  const active = periods.find((period) => {
    if (!period.dateStart || !period.dateEnd) return false;
    const start = new Date(period.dateStart);
    const end = new Date(period.dateEnd);
    return start <= today && today <= end;
  });
  if (active) return active;
  const sorted = [...periods].sort((a, b) => {
    const aEnd = a.dateEnd ? new Date(a.dateEnd).getTime() : 0;
    const bEnd = b.dateEnd ? new Date(b.dateEnd).getTime() : 0;
    return bEnd - aEnd;
  });
  return sorted[0] ?? null;
}

/**
 * Resolves the tax period that should back the reporting screens by default:
 * the period containing today, otherwise the most recent period.
 */
export function useCurrentTaxPeriod() {
  const query = useTaxPeriods();
  const period = query.data?.taxPeriods ? pickCurrentPeriod(query.data.taxPeriods) : null;
  return { ...query, period, periodId: period?.id };
}

export function currentMonthRange(today = new Date()): { start: string; end: string } {
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
  const toIso = (date: Date) => date.toISOString().slice(0, 10);
  return { start: toIso(start), end: toIso(end) };
}

/**
 * Report query params for the current tax period, plus whether they are ready.
 */
export function useReportPeriod(): { periodId?: number; params?: ReportQuery; enabled: boolean } {
  const { periodId } = useCurrentTaxPeriod();
  return {
    periodId,
    params: periodId != null ? { periodId } : undefined,
    enabled: periodId != null,
  };
}
