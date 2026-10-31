"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/badge";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";
import { getSwantaraService } from "@/lib/services/swantara";

function useDisqualifyFormSchema() {
  const t = useTranslations("Crm");
  return z.object({
    reason: z.string().min(1, t("validationLostReasonRequired")),
    lostReasonCode: z.string(),
  });
}
type DisqualifyValues = z.infer<ReturnType<typeof useDisqualifyFormSchema>>;

export function DisqualifyDialog({
  open,
  onOpenChange,
  orgId,
  leadId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leadId: string;
  onDone: () => void;
}) {
  const t = useTranslations("Crm");
  const queryClient = useQueryClient();
  const schema = useDisqualifyFormSchema();
  const form = useForm<DisqualifyValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "", lostReasonCode: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ reason: "", lostReasonCode: "" });
    }
  }, [open, form]);

  const disqualifyMutation = useMutation({
    mutationFn: (values: DisqualifyValues) =>
      getSwantaraService().crmLeads.transitionStatus(Number(orgId), Number(leadId), {
        status: "disqualified",
        reason: values.reason,
        lostReasonCode: values.lostReasonCode || null,
      }),
    onSuccess: () => {
      toast.success(t("lifecycleUpdated"));
      void queryClient.invalidateQueries({ queryKey: ["crmLeads"] });
      onDone();
    },
    onError: () => {
      toast.error(t("saveFailed"));
    },
  });

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("disqualifyTitle")}
      description={t("disqualifyDescription")}
      badge={<Badge variant="destructive">{t("status.disqualified")}</Badge>}
      form={form}
      onSubmit={(values) => disqualifyMutation.mutate(values)}
      isPending={disqualifyMutation.isPending}
      submitLabel={t("actionDisqualify")}
      submitVariant="destructive"
      footerHint={t("disqualifyHint")}
      className="sm:max-w-lg"
    >
      <FormField name="reason" label={t("fieldLostReason")} description={t("lostReasonHint")}>
        {({ field, id }) => (
          <Textarea
            {...field}
            id={id}
            autoFocus
            rows={4}
            placeholder={t("lostReasonPlaceholder")}
          />
        )}
      </FormField>
      <FormField name="lostReasonCode" label={t("fieldLostReasonCode")}>
        {({ field, id }) => (
          <Input
            {...field}
            id={id}
            placeholder={t("lostReasonCodePlaceholder")}
            autoComplete="off"
          />
        )}
      </FormField>
    </EntityFormDialog>
  );
}
