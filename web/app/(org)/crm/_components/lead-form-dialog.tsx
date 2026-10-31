"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/badge";
import { CurrencyField } from "@/components/currency-field";
import { DatePicker } from "@/components/date-picker";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { Input } from "@/components/input";
import { Progress } from "@/components/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { Switch } from "@/components/switch";
import { Textarea } from "@/components/textarea";
import { DEFAULT_CURRENCY } from "@/lib/constants/currency";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type {
  Contact,
  CreateCrmLeadRequest,
  CrmLead,
  CrmStage,
  SalesGroup,
} from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatNumber, getLocalDateString } from "@/lib/utils";
import { CrmFormSection } from "./crm-form-section";

function useLeadFormSchema(effectiveType: string) {
  const t = useTranslations("Crm");
  return z
    .object({
      name: z.string().min(1, t("validationNameRequired")),
      contactId: z.string(),
      contactName: z.string(),
      email: z.string().refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
        message: t("validationEmailInvalid"),
      }),
      phone: z.string(),
      jobPosition: z.string(),
      stageId: z.string().refine(
        (v) => {
          if (effectiveType === "opportunity" && v === "") return false;
          return true;
        },
        { message: t("validationStageRequired") },
      ),
      expectedRevenue: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, {
        message: t("validationRevenueNegative"),
      }),
      probability: z
        .string()
        .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100, {
          message: t("validationProbabilityRange"),
        }),
      priority: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, {
        message: t("validationPriorityNegative"),
      }),
      salespersonId: z.string(),
      salesGroupId: z.string(),
      source: z.string(),
      medium: z.string(),
      campaign: z.string(),
      expectedClose: z.string(),
      currencyCode: z.string().trim(),
      status: z.string(),
      temperature: z.string(),
      needSummary: z.string(),
      budgetAmount: z
        .string()
        .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
          message: t("validationRevenueNegative"),
        }),
      budgetConfirmed: z.boolean(),
      authorityConfirmed: z.boolean(),
      timelineDate: z.string(),
      fitScore: z
        .string()
        .refine(
          (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
          {
            message: t("validationProbabilityRange"),
          },
        ),
      intentScore: z
        .string()
        .refine(
          (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
          {
            message: t("validationProbabilityRange"),
          },
        ),
      qualificationNotes: z.string(),
      forecastCategory: z.string(),
      decisionCriteria: z.string(),
      competition: z.string(),
      proposedSolution: z.string(),
      nextStep: z.string(),
      nextStepDue: z.string(),
      consentGranted: z.boolean(),
      consentSource: z.string(),
      doNotContact: z.boolean(),
    })
    .superRefine((values, ctx) => {
      if (effectiveType !== "opportunity") return;
      if (!values.contactId && !values.contactName.trim() && !values.email.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contactName"],
          message: t("validationContactRequired"),
        });
      }
      if (!values.needSummary.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["needSummary"],
          message: t("validationNeedRequired"),
        });
      }
    });
}
type LeadFormValues = z.infer<ReturnType<typeof useLeadFormSchema>>;

export function LeadFormDialog({
  open,
  onOpenChange,
  orgId,
  initial,
  type,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  initial?: CrmLead | null;
  type?: "prospect" | "opportunity";
  onSave: () => void;
}) {
  const isEdit = Boolean(initial);
  const effectiveType = initial?.type ?? type ?? "prospect";
  const isOpportunity = effectiveType === "opportunity";
  const t = useTranslations("Crm");
  const queryClient = useQueryClient();

  const contactsQuery = useOrgListQuery<{ contacts: Contact[] }, Record<string, never>>(
    "contacts",
    (organizationId) => getSwantaraService().contacts.list(organizationId),
  );
  const stagesQuery = useOrgListQuery<{ stages: CrmStage[] }, Record<string, never>>(
    "crmStages",
    (organizationId) => getSwantaraService().crmStages.list(organizationId),
  );
  const teamsQuery = useOrgListQuery<{ teams: SalesGroup[] }, Record<string, never>>(
    "salesGroups",
    (organizationId) => getSwantaraService().salesGroups.list(organizationId),
  );

  const currenciesQuery = useQuery({
    queryKey: ["currencies"],
    queryFn: () => getSwantaraService().currencies.list(),
  });

  const contacts = contactsQuery.data?.contacts ?? [];
  const stages = stagesQuery.data?.stages ?? [];
  const teams = teamsQuery.data?.teams ?? [];
  const currencyOptions = (currenciesQuery.data?.currencies ?? []).map((currency) => ({
    code: currency.code,
    name: currency.name,
  }));

  const schema = useLeadFormSchema(effectiveType);

  const defaultValues: LeadFormValues = initial
    ? {
        name: initial.name,
        contactId: initial.contactId != null ? String(initial.contactId) : "",
        contactName: initial.contactName ?? "",
        email: initial.email ?? "",
        phone: initial.phone ?? "",
        jobPosition: initial.jobPosition ?? "",
        stageId: initial.stageId != null ? String(initial.stageId) : "",
        expectedRevenue: String(initial.expectedRevenue),
        probability: String(initial.probability),
        priority: String(initial.priority),
        salespersonId: initial.salespersonId != null ? String(initial.salespersonId) : "",
        salesGroupId: initial.salesGroupId != null ? String(initial.salesGroupId) : "",
        currencyCode: DEFAULT_CURRENCY,
        source: initial.source ?? "",
        medium: initial.medium ?? "",
        campaign: initial.campaign ?? "",
        expectedClose: initial.expectedClose
          ? getLocalDateString(new Date(initial.expectedClose))
          : "",
        status: initial.status,
        temperature: initial.temperature,
        needSummary: initial.needSummary ?? "",
        budgetAmount: initial.budgetAmount != null ? String(initial.budgetAmount) : "",
        budgetConfirmed: initial.budgetConfirmed,
        authorityConfirmed: initial.authorityConfirmed,
        timelineDate: initial.timelineDate
          ? getLocalDateString(new Date(initial.timelineDate))
          : "",
        fitScore: String(initial.fitScore ?? 0),
        intentScore: String(initial.intentScore ?? 0),
        qualificationNotes: initial.qualificationNotes ?? "",
        forecastCategory: initial.forecastCategory,
        decisionCriteria: initial.decisionCriteria ?? "",
        competition: initial.competition ?? "",
        proposedSolution: initial.proposedSolution ?? "",
        nextStep: initial.nextStep ?? "",
        nextStepDue: initial.nextStepDue ? getLocalDateString(new Date(initial.nextStepDue)) : "",
        consentGranted: initial.consentGranted,
        consentSource: initial.consentSource ?? "",
        doNotContact: initial.doNotContact,
      }
    : {
        name: "",
        contactId: "",
        contactName: "",
        email: "",
        phone: "",
        jobPosition: "",
        stageId: "",
        expectedRevenue: "0",
        probability: "10",
        priority: "0",
        salespersonId: "",
        salesGroupId: "",
        currencyCode: DEFAULT_CURRENCY,
        source: "",
        medium: "",
        campaign: "",
        expectedClose: "",
        status: isOpportunity ? "qualified" : "new",
        temperature: "warm",
        needSummary: "",
        budgetAmount: "",
        budgetConfirmed: false,
        authorityConfirmed: false,
        timelineDate: "",
        fitScore: "0",
        intentScore: "0",
        qualificationNotes: "",
        forecastCategory: "pipeline",
        decisionCriteria: "",
        competition: "",
        proposedSolution: "",
        nextStep: "",
        nextStepDue: "",
        consentGranted: false,
        consentSource: "",
        doNotContact: false,
      };

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watchedRevenue = form.watch("expectedRevenue");
  const watchedProbability = form.watch("probability");
  const watchedStageId = form.watch("stageId");
  const selectedStage = stages.find((s) => String(s.id) === watchedStageId);
  const weightedValue =
    !Number.isNaN(Number(watchedRevenue)) && !Number.isNaN(Number(watchedProbability))
      ? (Number(watchedRevenue) * Number(watchedProbability)) / 100
      : 0;

  const updateLeadMutation = useMutation({
    mutationFn: (payload: CreateCrmLeadRequest) =>
      getSwantaraService().crmLeads.update(Number(orgId), initial!.id, payload),
    onSuccess: () => {
      toast.success(t("updated"));
      void queryClient.invalidateQueries({ queryKey: ["crmLeads"] });
      onSave();
    },
    onError: () => {
      toast.error(t("saveFailed"));
    },
  });

  const updateOpportunityMutation = useMutation({
    mutationFn: (payload: CreateCrmLeadRequest) =>
      getSwantaraService().crmOpportunities.update(Number(orgId), initial!.id, payload),
    onSuccess: () => {
      toast.success(t("updated"));
      void queryClient.invalidateQueries({ queryKey: ["crmOpportunities"] });
      onSave();
    },
    onError: () => {
      toast.error(t("saveFailed"));
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: (payload: CreateCrmLeadRequest) =>
      getSwantaraService().crmLeads.create(Number(orgId), payload),
    onSuccess: () => {
      toast.success(t("created"));
      void queryClient.invalidateQueries({ queryKey: ["crmLeads"] });
      onSave();
    },
    onError: () => {
      toast.error(t("saveFailed"));
    },
  });

  const createOpportunityMutation = useMutation({
    mutationFn: (payload: CreateCrmLeadRequest) =>
      getSwantaraService().crmOpportunities.create(Number(orgId), payload),
    onSuccess: () => {
      toast.success(t("created"));
      void queryClient.invalidateQueries({ queryKey: ["crmOpportunities"] });
      onSave();
    },
    onError: () => {
      toast.error(t("saveFailed"));
    },
  });

  const isPending =
    updateLeadMutation.isPending ||
    updateOpportunityMutation.isPending ||
    createLeadMutation.isPending ||
    createOpportunityMutation.isPending;

  function handleSubmit(values: LeadFormValues) {
    const payload = {
      organizationId: Number(orgId),
      name: values.name,
      type: effectiveType,
      contactId: values.contactId ? Number(values.contactId) : null,
      contactName: values.contactName || null,
      email: values.email || null,
      phone: values.phone || null,
      jobPosition: values.jobPosition || null,
      stageId: values.stageId ? Number(values.stageId) : null,
      expectedRevenue: Number(values.expectedRevenue),
      probability: Number(values.probability),
      priority: Number(values.priority),
      salespersonId: values.salespersonId ? Number(values.salespersonId) : null,
      salesGroupId: values.salesGroupId ? Number(values.salesGroupId) : null,
      source: values.source || null,
      medium: values.medium || null,
      campaign: values.campaign || null,
      expectedClose: values.expectedClose || null,
      status: values.status as CreateCrmLeadRequest["status"],
      temperature: values.temperature as CreateCrmLeadRequest["temperature"],
      needSummary: values.needSummary || null,
      budgetAmount: values.budgetAmount === "" ? null : Number(values.budgetAmount),
      budgetConfirmed: values.budgetConfirmed,
      authorityConfirmed: values.authorityConfirmed,
      timelineDate: values.timelineDate || null,
      fitScore: values.fitScore === "" ? 0 : Number(values.fitScore),
      intentScore: values.intentScore === "" ? 0 : Number(values.intentScore),
      qualificationNotes: values.qualificationNotes || null,
      forecastCategory: values.forecastCategory as CreateCrmLeadRequest["forecastCategory"],
      decisionCriteria: values.decisionCriteria || null,
      competition: values.competition || null,
      proposedSolution: values.proposedSolution || null,
      nextStep: values.nextStep || null,
      nextStepDue: values.nextStepDue || null,
      consentGranted: values.consentGranted,
      consentSource: values.consentSource || null,
      doNotContact: values.doNotContact,
    };

    if (isEdit && initial) {
      if (initial.type === "prospect") {
        updateLeadMutation.mutate(payload);
      } else {
        updateOpportunityMutation.mutate(payload);
      }
    } else {
      if (effectiveType === "prospect") {
        createLeadMutation.mutate(payload);
      } else {
        createOpportunityMutation.mutate(payload);
      }
    }
  }

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? isOpportunity
            ? t("editOpportunity")
            : t("editLead")
          : isOpportunity
            ? t("newOpportunity")
            : t("newLead")
      }
      description={isOpportunity ? t("opportunityFormDescription") : t("leadFormDescription")}
      badge={
        <Badge variant={isOpportunity ? "default" : "secondary"}>
          {isOpportunity ? t("opportunityBadge") : t("leadBadge")}
        </Badge>
      }
      form={form}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={
        isEdit ? t("saveChanges") : isOpportunity ? t("createOpportunity") : t("createLead")
      }
      footerHint={isOpportunity ? t("stageForecastHint") : undefined}
      className="max-h-[85vh] sm:max-w-2xl"
    >
      <CrmFormSection
        title={isOpportunity ? t("sectionDeal") : t("sectionLeadDetails")}
        description={isOpportunity ? t("sectionDealDescription") : t("sectionLeadDescription")}
      >
        <FormField
          name="name"
          label={t("fieldName")}
          description={t("fieldNameHint")}
          className="sm:col-span-2"
        >
          {({ field, id }) => (
            <Input {...field} id={id} placeholder={t("fieldName")} autoFocus autoComplete="off" />
          )}
        </FormField>
        <FormField
          name="source"
          label={t("fieldSource")}
          description={isOpportunity ? t("sourceOpportunityHint") : t("sourceLeadHint")}
        >
          {({ field, id }) => (
            <Input {...field} id={id} placeholder={t("sourcePlaceholder")} autoComplete="off" />
          )}
        </FormField>
        <FormField name="medium" label={t("fieldMedium")} description={t("mediumHint")}>
          {({ field, id }) => (
            <Input {...field} id={id} placeholder={t("mediumPlaceholder")} autoComplete="off" />
          )}
        </FormField>
        <FormField name="campaign" label={t("fieldCampaign")} description={t("campaignHint")}>
          {({ field, id }) => (
            <Input {...field} id={id} placeholder={t("campaignPlaceholder")} autoComplete="off" />
          )}
        </FormField>
        <FormField
          name="expectedClose"
          label={t("tableExpectedClose")}
          description={t("expectedCloseHint")}
        >
          {({ field }) => (
            <DatePicker
              selected={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
              onSelect={(day) => field.onChange(day ? getLocalDateString(day) : "")}
              defaultMonth={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
            />
          )}
        </FormField>
        <FormField name="temperature" label={t("fieldTemperature")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldTemperature")}>
                <SelectValue placeholder={t("fieldTemperature")} />
              </SelectTrigger>
              <SelectContent>
                {(["cold", "warm", "hot", "referral", "existing"] as const).map((temperature) => (
                  <SelectItem key={temperature} value={temperature}>
                    {t(`temperature.${temperature}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </CrmFormSection>

      <CrmFormSection title={t("sectionContact")} description={t("sectionContactDescription")}>
        <FormField name="contactId" label={t("tableContact")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("tableContact")}>
                <SelectValue placeholder={t("noContact")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("noContact")}</SelectItem>
                {contacts.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.displayName || p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField
          name="contactName"
          label={t("fieldContactName")}
          description={t("contactNameHint")}
        >
          {({ field, id }) => (
            <Input
              {...field}
              id={id}
              placeholder={t("contactNamePlaceholder")}
              autoComplete="off"
            />
          )}
        </FormField>
        <FormField name="email" label={t("fieldEmail")}>
          {({ field, id }) => (
            <Input
              {...field}
              id={id}
              type="email"
              placeholder={t("emailPlaceholder")}
              autoComplete="email"
            />
          )}
        </FormField>
        <FormField name="phone" label={t("fieldPhone")}>
          {({ field, id }) => (
            <Input {...field} id={id} placeholder={t("phonePlaceholder")} autoComplete="tel" />
          )}
        </FormField>
        <FormField name="jobPosition" label={t("fieldJobPosition")} className="sm:col-span-2">
          {({ field, id }) => (
            <Input
              {...field}
              id={id}
              placeholder={t("jobPositionPlaceholder")}
              autoComplete="off"
            />
          )}
        </FormField>
      </CrmFormSection>

      <CrmFormSection
        title={isOpportunity ? t("sectionPipeline") : t("sectionQualification")}
        description={isOpportunity ? t("pipelineHint") : t("qualificationHint")}
      >
        <FormField
          name="stageId"
          label={t("tableStage")}
          description={
            selectedStage
              ? t("stageDefaultHint", { probability: selectedStage.probability })
              : isOpportunity
                ? t("stageRequiredHint")
                : t("stageOptionalHint")
          }
          className="sm:col-span-2"
        >
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("tableStage")}>
                <SelectValue placeholder={t("noStage")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("noStage")}</SelectItem>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} — {s.probability}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="needSummary" label={t("fieldNeedSummary")} className="sm:col-span-2">
          {({ field, id }) => (
            <Textarea {...field} id={id} rows={2} placeholder={t("needSummaryPlaceholder")} />
          )}
        </FormField>
        <FormField name="fitScore" label={t("fieldFitScore")} description={t("scoreHint")}>
          {({ field, id }) => <Input {...field} id={id} type="number" min="0" max="100" />}
        </FormField>
        <FormField name="intentScore" label={t("fieldIntentScore")} description={t("scoreHint")}>
          {({ field, id }) => <Input {...field} id={id} type="number" min="0" max="100" />}
        </FormField>
        <FormField name="budgetAmount" label={t("fieldBudget")}>
          {({ field, id }) => (
            <CurrencyField
              id={id}
              value={field.value === "" ? null : Number(field.value)}
              onValueChange={(v) => field.onChange(v == null ? "" : String(v))}
              currency={form.watch("currencyCode") || DEFAULT_CURRENCY}
            />
          )}
        </FormField>
        <FormField name="timelineDate" label={t("fieldTimeline")}>
          {({ field }) => (
            <DatePicker
              selected={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
              onSelect={(day) => field.onChange(day ? getLocalDateString(day) : "")}
              defaultMonth={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
            />
          )}
        </FormField>
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:flex-wrap sm:gap-6">
          <FormField name="budgetConfirmed" label={t("fieldBudgetConfirmed")}>
            {({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-label={t("fieldBudgetConfirmed")}
              />
            )}
          </FormField>
          <FormField name="authorityConfirmed" label={t("fieldAuthorityConfirmed")}>
            {({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-label={t("fieldAuthorityConfirmed")}
              />
            )}
          </FormField>
        </div>
        <FormField
          name="qualificationNotes"
          label={t("fieldQualificationNotes")}
          className="sm:col-span-2"
        >
          {({ field, id }) => (
            <Textarea
              {...field}
              id={id}
              rows={2}
              placeholder={t("qualificationNotesPlaceholder")}
            />
          )}
        </FormField>
        {isOpportunity ? (
          <>
            <FormField name="forecastCategory" label={t("fieldForecastCategory")}>
              {({ field, id }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={id} aria-label={t("fieldForecastCategory")}>
                    <SelectValue placeholder={t("fieldForecastCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(["pipeline", "best_case", "commit"] as const).map((category) => (
                      <SelectItem key={category} value={category}>
                        {t(`forecast.${category}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
            <FormField name="decisionCriteria" label={t("fieldDecisionCriteria")}>
              {({ field, id }) => (
                <Textarea
                  {...field}
                  id={id}
                  rows={2}
                  placeholder={t("decisionCriteriaPlaceholder")}
                />
              )}
            </FormField>
            <FormField name="competition" label={t("fieldCompetition")}>
              {({ field, id }) => (
                <Textarea {...field} id={id} rows={2} placeholder={t("competitionPlaceholder")} />
              )}
            </FormField>
            <FormField
              name="proposedSolution"
              label={t("fieldProposedSolution")}
              className="sm:col-span-2"
            >
              {({ field, id }) => (
                <Textarea
                  {...field}
                  id={id}
                  rows={2}
                  placeholder={t("proposedSolutionPlaceholder")}
                />
              )}
            </FormField>
          </>
        ) : null}
        <FormField name="expectedRevenue" label={t("tableExpectedRevenue")}>
          {({ field, id }) => (
            <CurrencyField
              id={id}
              value={field.value === "" ? null : Number(field.value)}
              onValueChange={(v) => field.onChange(String(v ?? 0))}
              currency={form.watch("currencyCode") || DEFAULT_CURRENCY}
            />
          )}
        </FormField>
        <FormField name="currencyCode" label={t("fieldCurrency")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldCurrency")}>
                <SelectValue placeholder={t("fieldCurrency")} />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField
          name="probability"
          label={t("probabilityLabel")}
          description={t("probabilityHint")}
        >
          {({ field, id }) => <Input {...field} id={id} type="number" min="0" max="100" />}
        </FormField>
        <div className="rounded-lg border bg-muted/40 p-3 sm:col-span-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs text-muted-foreground">{t("weightedValue")}</p>
            <p className="text-sm tabular-nums">{formatNumber(weightedValue)}</p>
          </div>
          <Progress
            value={Number.isFinite(Number(watchedProbability)) ? Number(watchedProbability) : 0}
            className="mt-2"
            aria-label={t("tableProbability")}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">{t("weightedHint")}</p>
        </div>
        <FormField name="priority" label={t("fieldPriority")} description={t("priorityHint")}>
          {({ field, id }) => <Input {...field} id={id} type="number" min="0" />}
        </FormField>
        <div className="hidden sm:block" aria-hidden />
      </CrmFormSection>

      <CrmFormSection title={t("sectionNextStep")} description={t("nextStepHint")}>
        <FormField name="nextStep" label={t("fieldNextStep")} className="sm:col-span-2">
          {({ field, id }) => (
            <Input {...field} id={id} placeholder={t("nextStepPlaceholder")} autoComplete="off" />
          )}
        </FormField>
        <FormField name="nextStepDue" label={t("fieldNextStepDue")}>
          {({ field }) => (
            <DatePicker
              selected={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
              onSelect={(day) => field.onChange(day ? getLocalDateString(day) : "")}
              defaultMonth={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
            />
          )}
        </FormField>
        <FormField name="consentSource" label={t("fieldConsentSource")}>
          {({ field, id }) => (
            <Input
              {...field}
              id={id}
              placeholder={t("consentSourcePlaceholder")}
              autoComplete="off"
            />
          )}
        </FormField>
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:flex-wrap sm:gap-6">
          <FormField name="consentGranted" label={t("fieldConsentGranted")}>
            {({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-label={t("fieldConsentGranted")}
              />
            )}
          </FormField>
          <FormField name="doNotContact" label={t("fieldDoNotContact")}>
            {({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-label={t("fieldDoNotContact")}
              />
            )}
          </FormField>
        </div>
      </CrmFormSection>

      <CrmFormSection title={t("sectionOwnership")} description={t("ownershipHint")}>
        <FormField name="salespersonId" label={t("fieldSalesperson")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldSalesperson")}>
                <SelectValue placeholder={t("unassigned")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("unassigned")}</SelectItem>
                {contacts.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.displayName || p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="salesGroupId" label={t("fieldSalesTeam")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldSalesTeam")}>
                <SelectValue placeholder={t("noTeam")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("noTeam")}</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={String(team.id)}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </CrmFormSection>
    </EntityFormDialog>
  );
}
