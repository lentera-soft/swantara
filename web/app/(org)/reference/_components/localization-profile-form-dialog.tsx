"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { Input } from "@/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { Switch } from "@/components/switch";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Currency, LocalizationProfile } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { logger } from "@/lib/utils/client-logger";

function useLocalizationProfileSchema() {
  const t = useTranslations("Reference");
  return z.object({
    name: z.string().trim().min(1, t("validationNameRequired")),
    countryCode: z.string().trim().min(1, t("validationCountryRequired")),
    currencyCode: z.string().trim().min(1, t("validationCurrencyRequired")),
    locale: z.string(),
    timezone: z.string(),
    dateFormat: z.string(),
    taxYearStartMonth: z
      .string()
      .min(1, t("validationTaxYearMonthRequired"))
      .refine((value) => {
        const month = Number(value);
        return Number.isInteger(month) && month >= 1 && month <= 12;
      }, t("validationTaxYearMonthRange")),
    active: z.boolean(),
  });
}

type ProfileValues = z.infer<ReturnType<typeof useLocalizationProfileSchema>>;

function toDefaultValues(initial?: LocalizationProfile | null): ProfileValues {
  return initial
    ? {
        name: initial.name,
        countryCode: initial.countryCode,
        currencyCode: initial.currencyCode,
        locale: initial.locale,
        timezone: initial.timezone,
        dateFormat: initial.dateFormat,
        taxYearStartMonth: String(initial.taxYearStartMonth),
        active: initial.active,
      }
    : {
        name: "",
        countryCode: "",
        currencyCode: "",
        locale: "",
        timezone: "",
        dateFormat: "",
        taxYearStartMonth: "1",
        active: true,
      };
}

export function LocalizationProfileFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: LocalizationProfile | null;
  onSave: () => void;
}) {
  const isEdit = Boolean(initial);
  const t = useTranslations("Reference");
  const tCommon = useTranslations("Common");

  const currenciesQuery = useOrgListQuery<{ currencies: Currency[] }, Record<string, never>>(
    "currencies",
    () => getSwantaraService().currencies.list(),
  );
  const currencies = currenciesQuery.data?.currencies ?? [];

  const schema = useLocalizationProfileSchema();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(schema),
    defaultValues: toDefaultValues(initial),
  });

  useEffect(() => {
    if (open) {
      form.reset(toDefaultValues(initial));
    }
  }, [open, initial, form]);

  function handleSubmit(values: ProfileValues) {
    const request = {
      name: values.name,
      countryCode: values.countryCode.toUpperCase(),
      currencyCode: values.currencyCode.toUpperCase(),
      locale: values.locale,
      timezone: values.timezone,
      dateFormat: values.dateFormat,
      taxYearStartMonth: Number(values.taxYearStartMonth),
      active: values.active,
    };

    const promise =
      isEdit && initial
        ? getSwantaraService().localizationProfiles.update(initial.id, request)
        : getSwantaraService().localizationProfiles.create(request);

    return promise
      .then(() => {
        toast.success(t("profileSaved"));
        onSave();
      })
      .catch((error) => {
        logger.error("Failed to save localization profile", error);
        toast.error(t("toastFailed"));
      });
  }

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t("editLocalizationProfile") : t("newLocalizationProfile")}
      description={t("localizationProfileDialogDescription")}
      form={form}
      onSubmit={handleSubmit}
      submitLabel={tCommon("save")}
      cancelLabel={tCommon("cancel")}
      className="sm:max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <FormField name="name" label={t("fieldName")}>
          {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldName")} />}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="countryCode" label={t("fieldCountry")}>
            {({ field, id }) => <Input {...field} id={id} maxLength={2} placeholder="ID" />}
          </FormField>
          <FormField name="currencyCode" label={t("fieldCurrencyCode")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("fieldCurrencyCode")}>
                  <SelectValue placeholder={t("fieldCurrency")} />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="locale" label={t("fieldLocale")}>
            {({ field, id }) => <Input {...field} id={id} placeholder="id-ID" />}
          </FormField>
          <FormField name="timezone" label={t("fieldTimezone")}>
            {({ field, id }) => <Input {...field} id={id} placeholder="Asia/Jakarta" />}
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="dateFormat" label={t("fieldDateFormat")}>
            {({ field, id }) => <Input {...field} id={id} placeholder="DD/MM/YYYY" />}
          </FormField>
          <FormField name="taxYearStartMonth" label={t("fieldTaxYearStartMonth")}>
            {({ field, id }) => <Input {...field} id={id} type="number" min="1" max="12" />}
          </FormField>
        </div>
        <FormField name="active" label={t("fieldActive")}>
          {({ field }) => (
            <Switch
              checked={Boolean(field.value)}
              onCheckedChange={(checked) => field.onChange(Boolean(checked))}
              aria-label={t("fieldActive")}
            />
          )}
        </FormField>
      </div>
    </EntityFormDialog>
  );
}
