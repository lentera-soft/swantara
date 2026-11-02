"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/badge";
import { Checkbox } from "@/components/checkbox";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { Textarea } from "@/components/textarea";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { CrmStage } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { sortedStages } from "./crm-utils";

function useAdvanceStageFormSchema() {
  const t = useTranslations("Crm");
  return z.object({
    stageId: z.string().min(1, t("validationStageRequired")),
    exitCriteriaAck: z.boolean(),
    lostReason: z.string(),
    notes: z.string(),
  });
}
type AdvanceStageValues = z.infer<ReturnType<typeof useAdvanceStageFormSchema>>;

export function AdvanceStageDialog({
  open,
  onOpenChange,
  orgId,
  opportunityId,
  currentStageId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  opportunityId: string;
  currentStageId: number | null;
  onDone: () => void;
}) {
  const t = useTranslations("Crm");
  const queryClient = useQueryClient();
  const stagesQuery = useOrgListQuery<{ stages: CrmStage[] }, Record<string, never>>(
    "crmStages",
    (organizationId) => getSwantaraService().crmStages.list(organizationId),
  );
  const schema = useAdvanceStageFormSchema();
  const form = useForm<AdvanceStageValues>({
    resolver: zodResolver(schema),
    defaultValues: { stageId: "", exitCriteriaAck: false, lostReason: "", notes: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ stageId: "", exitCriteriaAck: false, lostReason: "", notes: "" });
    }
  }, [open, form]);

  const targetStages = sortedStages(stagesQuery.data?.stages ?? []).filter(
    (stage) => String(stage.id) !== String(currentStageId ?? ""),
  );
  const selectedStage = targetStages.find((stage) => String(stage.id) === form.watch("stageId"));

  const advanceMutation = useMutation({
    mutationFn: (payload: {
      stageId: number;
      exitCriteriaMet: boolean;
      notes: string | null;
      lostReason: string | null;
    }) =>
      getSwantaraService().crmOpportunities.advanceStage(Number(orgId), Number(opportunityId), {
        stageId: payload.stageId,
        exitCriteriaMet: payload.exitCriteriaMet,
        notes: payload.notes,
        lostReason: payload.lostReason,
      }),
    onSuccess: () => {
      toast.success(t("stageUpdated"));
      void queryClient.invalidateQueries({ queryKey: ["crmOpportunities"] });
      void queryClient.invalidateQueries({ queryKey: ["crmPipeline"] });
      void queryClient.invalidateQueries({ queryKey: ["crmRecord"] });
      void queryClient.invalidateQueries({ queryKey: ["crmRecordHistory"] });
      onDone();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "";
      toast.error(message || t("saveFailed"));
    },
  });

  function handleSubmit(values: AdvanceStageValues) {
    const target = selectedStage;
    if (target?.exitCriteria && !values.exitCriteriaAck) {
      form.setError("exitCriteriaAck", { message: t("exitCriteriaRequired") });
      return;
    }
    if (target?.isLost && values.lostReason.trim() === "") {
      form.setError("lostReason", { message: t("validationLostReasonRequired") });
      return;
    }
    advanceMutation.mutate({
      stageId: Number(values.stageId),
      exitCriteriaMet: Boolean(target?.exitCriteria),
      notes: values.notes.trim() || null,
      lostReason: target?.isLost ? values.lostReason.trim() : null,
    });
  }

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("advanceStageTitle")}
      description={t("advanceStageDescription")}
      badge={
        selectedStage ? (
          <Badge variant={selectedStage.isWon ? "default" : "secondary"}>
            {selectedStage.probability}%
          </Badge>
        ) : undefined
      }
      form={form}
      onSubmit={handleSubmit}
      isPending={advanceMutation.isPending}
      submitLabel={t("advanceStage")}
      className="sm:max-w-md"
    >
      <FormField name="stageId" label={t("tableStage")}>
        {({ field, id }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id={id} aria-label={t("tableStage")}>
              <SelectValue placeholder={t("selectStage")} />
            </SelectTrigger>
            <SelectContent>
              {targetStages.map((stage) => (
                <SelectItem key={stage.id} value={String(stage.id)}>
                  {stage.name} — {stage.probability}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
      {selectedStage?.exitCriteria ? (
        <FormField
          name="exitCriteriaAck"
          label={t("exitCriteriaLabel", { criteria: selectedStage.exitCriteria })}
        >
          {({ field, id }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={id}
                aria-label={t("exitCriteriaAck")}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <span className="text-sm">{t("exitCriteriaAck")}</span>
            </div>
          )}
        </FormField>
      ) : null}
      {selectedStage?.isLost ? (
        <FormField name="lostReason" label={t("fieldLostReason")}>
          {({ field, id }) => <Textarea id={id} rows={2} {...field} />}
        </FormField>
      ) : null}
      <FormField name="notes" label={t("fieldNote")}>
        {({ field, id }) => <Textarea id={id} rows={2} {...field} />}
      </FormField>
    </EntityFormDialog>
  );
}
