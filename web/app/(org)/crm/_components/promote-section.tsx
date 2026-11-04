"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/badge";
import { Checkbox } from "@/components/checkbox";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { FormSection } from "@/components/form-section";
import { Input } from "@/components/input";
import { Progress } from "@/components/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import { usePermissions } from "@/lib/hooks/use-permissions";
import type {
  Contact,
  CrmLead,
  CrmStage,
  PromoteLeadRequest,
  SalesGroup,
  SystemConfig,
} from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatNumber } from "@/lib/utils";

function usePromoteFormSchema() {
  const t = useTranslations("Crm");
  return z.object({
    stageId: z.string().min(1, t("validationStageRequired")),
    expectedRevenue: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0),
    probability: z
      .string()
      .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100)),
    priority: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0),
    expectedClose: z.string(),
    salespersonId: z.string(),
    salesGroupId: z.string(),
    allowUnqualified: z.boolean(),
  });
}
type PromoteValues = z.infer<ReturnType<typeof usePromoteFormSchema>>;

export function PromoteDialog({
  open,
  onOpenChange,
  orgId,
  prospectId,
  initial,
  onPromoted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  prospectId: string;
  initial?: CrmLead | null;
  onPromoted: () => void;
}) {
  const t = useTranslations("Crm");
  const permissions = usePermissions();
  const queryClient = useQueryClient();
  const stagesQuery = useOrgListQuery<{ stages: CrmStage[] }, Record<string, never>>(
    "crmStages",
    (organizationId) => getSwantaraService().crmStages.list(organizationId),
  );
  const contactsQuery = useOrgListQuery<{ contacts: Contact[] }, Record<string, never>>(
    "contacts",
    (organizationId) => getSwantaraService().contacts.list(organizationId),
  );
  const teamsQuery = useOrgListQuery<{ teams: SalesGroup[] }, Record<string, never>>(
    "salesGroups",
    (organizationId) => getSwantaraService().salesGroups.list(organizationId),
  );
  const configsQuery = useOrgListQuery<{ systemConfigs: SystemConfig[] }, Record<string, never>>(
    "systemConfigs",
    (organizationId) => getSwantaraService().systemConfigs.list(organizationId),
  );
  const stages = (stagesQuery.data?.stages ?? []).filter((stage) => !stage.isWon && !stage.isLost);
  const contacts = (contactsQuery.data?.contacts ?? []).filter((contact) => contact.isEmployee);
  const teams = teamsQuery.data?.teams ?? [];
  const canOverride = permissions.has("prospect.override");
  const requiredFields = useMemo(() => {
    const config = (configsQuery.data?.systemConfigs ?? []).find(
      (item) => item.key === "crm.promotion_required_fields",
    );
    const raw = Array.isArray(config?.value)
      ? config.value.filter((field): field is string => typeof field === "string")
      : null;
    const fields = raw && raw.length > 0 ? raw : ["contact", "need"];
    return Array.from(new Set(fields.map((field) => field.trim().toLowerCase()).filter(Boolean)));
  }, [configsQuery.data]);
  const missingFields = useMemo(() => {
    const labels: Record<string, string> = {
      contact: t("promotionMissingContact"),
      need: t("promotionMissingNeed"),
      budget: t("promotionMissingBudget"),
      authority: t("promotionMissingAuthority"),
      timeline: t("promotionMissingTimeline"),
      consent: t("promotionMissingConsent"),
    };
    const satisfied: Record<string, boolean> = {
      contact: Boolean(initial?.contactId || initial?.contactName || initial?.email),
      need: Boolean(initial?.needSummary && initial.needSummary.trim() !== ""),
      budget: Boolean(initial?.budgetConfirmed && initial?.budgetAmount != null),
      authority: Boolean(initial?.authorityConfirmed),
      timeline: Boolean(initial?.timelineDate),
      consent: Boolean(initial?.consentGranted),
    };
    return requiredFields
      .filter((field) => labels[field] !== undefined && !satisfied[field])
      .map((field) => labels[field]);
  }, [requiredFields, initial, t]);

  const schema = usePromoteFormSchema();

  const form = useForm<PromoteValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      stageId: "",
      expectedRevenue: "0",
      probability: "",
      priority: "0",
      expectedClose: initial?.expectedClose ? String(initial.expectedClose).slice(0, 10) : "",
      salespersonId: initial?.salespersonId ? String(initial.salespersonId) : "",
      salesGroupId: initial?.salesGroupId ? String(initial.salesGroupId) : "",
      allowUnqualified: false,
    },
  });

  const watchedStageId = form.watch("stageId");
  const watchedRevenue = form.watch("expectedRevenue");
  const watchedProbability = form.watch("probability");
  const selectedStage = stages.find((s) => String(s.id) === watchedStageId);
  const effectiveProbability =
    watchedProbability === "" ? selectedStage?.probability : Number(watchedProbability);
  const weightedValue =
    !Number.isNaN(Number(watchedRevenue)) &&
    effectiveProbability != null &&
    !Number.isNaN(Number(effectiveProbability))
      ? (Number(watchedRevenue) * Number(effectiveProbability)) / 100
      : 0;

  const promoteMutation = useMutation({
    mutationFn: (payload: PromoteLeadRequest) =>
      getSwantaraService().crmLeads.promote(Number(orgId), Number(prospectId), payload),
    onSuccess: () => {
      toast.success(t("leadPromoted"));
      void queryClient.invalidateQueries({ queryKey: ["crmLeads"] });
      void queryClient.invalidateQueries({ queryKey: ["crmOpportunities"] });
      onPromoted();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "";
      if (message) {
        toast.error(message);
        return;
      }
      toast.error(t("saveFailed"));
    },
  });

  function handleSubmit(values: PromoteValues) {
    if (missingFields.length > 0 && !values.allowUnqualified) {
      toast.error(t("promotionMissingFields", { fields: missingFields.join(", ") }));
      return;
    }
    const payload = {
      stageId: Number(values.stageId),
      expectedRevenue: Number(values.expectedRevenue),
      probability: values.probability ? Number(values.probability) : null,
      priority: Number(values.priority),
      salespersonId: values.salespersonId
        ? Number(values.salespersonId)
        : (initial?.salespersonId ?? null),
      salesGroupId: values.salesGroupId
        ? Number(values.salesGroupId)
        : (initial?.salesGroupId ?? null),
      expectedClose: values.expectedClose || null,
      allowUnqualified: values.allowUnqualified,
    };
    promoteMutation.mutate(payload as PromoteLeadRequest);
  }

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("promoteTitle")}
      description={t("promoteDescription")}
      badge={<Badge variant="default">{t("opportunityBadge")}</Badge>}
      form={form}
      onSubmit={handleSubmit}
      isPending={promoteMutation.isPending}
      submitLabel={t("promoteSubmit")}
      footerHint={
        selectedStage
          ? t("promoteStageHint", { probability: selectedStage.probability })
          : t("promoteEmptyHint")
      }
      className="sm:max-w-xl"
    >
      <FormSection title={t("sectionPlacement")} description={t("placementHint")}>
        <FormField
          name="stageId"
          label={t("tableStage")}
          description={
            selectedStage
              ? t("stageDefaultHint", { probability: selectedStage.probability })
              : t("stageRequiredHint")
          }
          className="sm:col-span-2"
        >
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("tableStage")}>
                <SelectValue placeholder={t("selectStage")} />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={String(stage.id)}>
                    {stage.name} — {stage.probability}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="salespersonId" label={t("fieldSalesperson")}>
          {({ field, id }) => (
            <Select
              value={field.value || "none"}
              onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
            >
              <SelectTrigger id={id} aria-label={t("fieldSalesperson")}>
                <SelectValue placeholder={t("selectContact")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("unassignedOwner")}</SelectItem>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={String(contact.id)}>
                    {contact.displayName || contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="salesGroupId" label={t("fieldSalesTeam")}>
          {({ field, id }) => (
            <Select
              value={field.value || "none"}
              onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
            >
              <SelectTrigger id={id} aria-label={t("fieldSalesTeam")}>
                <SelectValue placeholder={t("fieldSalesTeam")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("unassignedOwner")}</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={String(team.id)}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </FormSection>

      {missingFields.length > 0 ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <p className="font-medium">{t("promotionMissingTitle")}</p>
          <p className="text-muted-foreground">
            {t("promotionMissingFields", { fields: missingFields.join(", ") })}
          </p>
          {canOverride ? (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Checkbox
                aria-label={t("promotionOverrideLabel")}
                checked={form.watch("allowUnqualified")}
                onCheckedChange={(checked) => form.setValue("allowUnqualified", checked === true)}
              />
              <span>{t("promotionOverrideLabel")}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <FormSection title={t("sectionDealValue")} description={t("dealValueHint")}>
        <FormField name="expectedRevenue" label={t("tableExpectedRevenue")}>
          {({ field, id }) => <Input {...field} id={id} type="number" step="any" min="0" />}
        </FormField>
        <FormField
          name="probability"
          label={t("probabilityLabel")}
          description={t("probabilityEmptyHint")}
        >
          {({ field, id }) => (
            <Input
              {...field}
              id={id}
              type="number"
              min="0"
              max="100"
              placeholder={t("probabilityAutoPlaceholder")}
            />
          )}
        </FormField>
        <div className="rounded-lg border bg-muted/40 p-3 sm:col-span-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">{t("weightedValue")}</p>
            <p className="text-sm font-semibold tabular-nums">{formatNumber(weightedValue)}</p>
          </div>
          <Progress value={Number(effectiveProbability) || 0} className="mt-2" />
        </div>
        <FormField name="priority" label={t("fieldPriority")} description={t("priorityHint")}>
          {({ field, id }) => <Input {...field} id={id} type="number" min="0" />}
        </FormField>
        <FormField name="expectedClose" label={t("tableExpectedClose")}>
          {({ field, id }) => <Input {...field} id={id} type="date" />}
        </FormField>
      </FormSection>
    </EntityFormDialog>
  );
}
