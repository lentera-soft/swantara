"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Currency, TaxPeriod } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { zodResolver } from "@/lib/utils/zod-resolver";

function useSchema() {
  const t = useTranslations("Consolidation");
  return z.object({
    periodId: z.string().min(1, t("validationPeriodRequired")),
    reportingCurrency: z.string().min(1, t("validationCurrencyRequired")),
  });
}
type Values = z.infer<ReturnType<typeof useSchema>>;

export function ConsolidationRunDialog({
  open,
  onOpenChange,
  orgId,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  onSave: () => void;
}) {
  const t = useTranslations("Consolidation");
  const tCommon = useTranslations("Common");
  const schema = useSchema();

  const periodsQuery = useOrgListQuery<{ taxPeriods: TaxPeriod[] }, Record<string, never>>(
    "taxPeriods",
    (organizationId) => getSwantaraService().taxPeriods.list(organizationId),
  );
  const currenciesQuery = useOrgListQuery<{ currencies: Currency[] }, Record<string, never>>(
    "currencies",
    () => getSwantaraService().currencies.list(),
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { periodId: "", reportingCurrency: "IDR" },
  });

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      getSwantaraService().consolidationRuns.create(Number(orgId), {
        periodId: Number(values.periodId),
        reportingCurrency: values.reportingCurrency,
      }),
    onSuccess: () => {
      toast.success(t("createSuccess"));
      onSave();
    },
    onError: () => toast.error(t("createFailed")),
  });

  const periods = periodsQuery.data?.taxPeriods ?? [];
  const currencies = currenciesQuery.data?.currencies ?? [];

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("newRun")}
      description={t("runDialogDescription")}
      form={form}
      onSubmit={(values) => mutation.mutate(values)}
      isPending={mutation.isPending}
      submitLabel={tCommon("save")}
      cancelLabel={tCommon("cancel")}
      className="sm:max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <FormField name="periodId" label={t("fieldPeriod")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldPeriod")}>
                <SelectValue placeholder={t("selectPeriod")} />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={String(period.id)}>
                    {period.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField name="reportingCurrency" label={t("fieldReportingCurrency")}>
          {({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-label={t("fieldReportingCurrency")}>
                <SelectValue placeholder={t("selectCurrency")} />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} — {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </div>
    </EntityFormDialog>
  );
}
