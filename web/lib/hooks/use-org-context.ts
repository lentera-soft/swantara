"use client";

import { useContext } from "react";

import { DEFAULT_CURRENCY } from "@/lib/constants/currency";
import { useMeOrganizationsQuery } from "@/lib/hooks/use-me-query";
import { OrgActiveContext } from "@/providers/org-active-provider";

export type ActiveOrg = {
  id: number;
  name?: string;
};

export function useActiveOrg(): ActiveOrg | null {
  const orgId = useContext(OrgActiveContext);
  return orgId == null ? null : { id: orgId };
}

export function useOrganizationId(): number | null {
  return useContext(OrgActiveContext);
}

export function useActiveOrgCurrency(): string {
  const organizationId = useContext(OrgActiveContext);
  const { data } = useMeOrganizationsQuery();
  const organization = (data?.organizations ?? []).find((org) => org?.id === organizationId);
  return organization?.baseCurrency || DEFAULT_CURRENCY;
}
