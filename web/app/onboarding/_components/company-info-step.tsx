"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/combobox";
import { CountryFlag } from "@/components/country-flag";
import { Field } from "@/components/field";
import { FieldFeedback } from "@/components/field-feedback";
import { InputGroupAddon } from "@/components/input-group";
import { Label } from "@/components/label";
import {
  QuestionnaireDescription,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireTitle,
} from "@/components/questionnaire";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import type { Country } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import type { OnboardingFormSchema } from "../_hooks/use-onboarding-form";

export function CompanyInfoStep() {
  const { control, setValue } = useFormContext<OnboardingFormSchema>();
  const t = useTranslations("Onboarding");
  const tx = t as unknown as (key: string) => string;
  const locale = useLocale();
  const nameId = useId();
  const countryId = useId();
  const currencyId = useId();
  const [countrySearch, setCountrySearch] = useState("");
  const debouncedCountrySearch = useDebouncedValue(countrySearch, 300);

  const countriesQuery = useQuery({
    queryKey: ["countries", debouncedCountrySearch],
    queryFn: () =>
      getSwantaraService().countries.list(
        debouncedCountrySearch
          ? { filter: [`name:like:${debouncedCountrySearch}`], size: 100 }
          : { size: 100 },
      ),
  });

  const currenciesQuery = useQuery({
    queryKey: ["currencies"],
    queryFn: () => getSwantaraService().currencies.list({ size: 100 }),
  });

  const localizedCountries = useMemo(() => {
    const items = countriesQuery.data?.countries ?? [];
    return items.map((country: Country) => {
      let name = country.name;
      try {
        name = new Intl.DisplayNames([locale], { type: "region" }).of(country.code) ?? name;
      } catch {
        // Keep the API-provided name when localization is unavailable.
      }
      return { code: country.code, name, currencyCode: country.currencyCode };
    });
  }, [countriesQuery.data, locale]);

  const currencies = useMemo(() => {
    const items = currenciesQuery.data?.currencies ?? [];
    return items.map((currency) => ({ code: currency.code, name: currency.name }));
  }, [currenciesQuery.data]);

  return (
    <QuestionnaireItem name="companyInfo" required>
      <QuestionnaireTitle className="font-heading text-2xl leading-tight font-medium tracking-tight">
        {tx("companyInfoTitle")}
      </QuestionnaireTitle>
      <QuestionnaireDescription className="mt-0">
        {tx("companyInfoDescription")}
      </QuestionnaireDescription>
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => {
          const errorId = fieldState.error ? `${nameId}-error` : undefined;
          const { value, onChange, onBlur, ref } = field;
          return (
            <Field>
              <Label htmlFor={nameId}>{tx("companyName")}</Label>
              <QuestionnaireInput
                id={nameId}
                type="text"
                autoComplete="organization"
                autoFocus
                placeholder={"Acme Inc."}
                aria-invalid={Boolean(fieldState.error)}
                aria-describedby={errorId}
                ref={ref}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onBlur={onBlur}
              />
              <FieldFeedback
                id={errorId}
                visible={Boolean(fieldState.error)}
                intent="danger"
                role={fieldState.error ? "alert" : undefined}
              >
                {fieldState.error?.message}
              </FieldFeedback>
            </Field>
          );
        }}
      />
      <Controller
        name="countryCode"
        control={control}
        render={({ field, fieldState }) => {
          const errorId = fieldState.error ? `${countryId}-error` : undefined;
          return (
            <Field>
              <Label htmlFor={countryId}>{tx("country")}</Label>
              <Combobox
                items={localizedCountries.map((country) => country.code)}
                itemToStringLabel={(value) =>
                  localizedCountries.find((country) => country.code === value)?.name ?? ""
                }
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value ?? "");
                  const country = localizedCountries.find((item) => item.code === value);
                  if (country) {
                    setValue("currencyCode", country.currencyCode, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
              >
                <ComboboxInput
                  id={countryId}
                  placeholder={tx("selectCountry")}
                  aria-invalid={Boolean(fieldState.error)}
                  aria-describedby={errorId}
                  onChange={(event) => setCountrySearch(event.target.value)}
                >
                  {field.value ? (
                    <InputGroupAddon align="inline-start" className="pointer-events-none">
                      <CountryFlag code={field.value} />
                      <span className="text-xs font-medium">{field.value}</span>
                    </InputGroupAddon>
                  ) : null}
                </ComboboxInput>
                <ComboboxContent>
                  <ComboboxList>
                    {(code: string) => {
                      const country = localizedCountries.find((c) => c.code === code);
                      if (!country) return null;
                      return (
                        <ComboboxItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-2">
                            <CountryFlag code={country.code} />
                            <span>{country.name}</span>
                            <span className="text-muted-foreground text-xs">{country.code}</span>
                          </span>
                        </ComboboxItem>
                      );
                    }}
                  </ComboboxList>
                  <ComboboxEmpty>{tx("noResults")}</ComboboxEmpty>
                </ComboboxContent>
              </Combobox>
              <QuestionnaireInput
                value={field.value}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                className="hidden"
              />
              <FieldFeedback
                id={errorId}
                visible={Boolean(fieldState.error)}
                intent="danger"
                role={fieldState.error ? "alert" : undefined}
              >
                {fieldState.error?.message}
              </FieldFeedback>
            </Field>
          );
        }}
      />
      <Controller
        name="currencyCode"
        control={control}
        render={({ field, fieldState }) => {
          const errorId = fieldState.error ? `${currencyId}-error` : undefined;
          return (
            <Field>
              <Label htmlFor={currencyId}>{tx("currency")}</Label>
              <Combobox
                items={currencies.map((currency) => currency.code)}
                itemToStringLabel={(value) => {
                  const currency = currencies.find((item) => item.code === value);
                  return currency ? `${currency.code} · ${currency.name}` : "";
                }}
                value={field.value}
                onValueChange={(value) => field.onChange(value ?? "")}
              >
                <ComboboxInput
                  id={currencyId}
                  placeholder={tx("selectCurrency")}
                  aria-invalid={Boolean(fieldState.error)}
                  aria-describedby={errorId}
                />
                <ComboboxContent>
                  <ComboboxList>
                    {(code: string) => {
                      const currency = currencies.find((item) => item.code === code);
                      if (!currency) return null;
                      return (
                        <ComboboxItem key={currency.code} value={currency.code}>
                          <span className="flex items-center gap-2">
                            <span className="font-medium">{currency.code}</span>
                            <span>{currency.name}</span>
                          </span>
                        </ComboboxItem>
                      );
                    }}
                  </ComboboxList>
                  <ComboboxEmpty>{tx("noResults")}</ComboboxEmpty>
                </ComboboxContent>
              </Combobox>
              <QuestionnaireInput
                value={field.value}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                className="hidden"
              />
              <FieldFeedback
                id={errorId}
                visible={Boolean(fieldState.error)}
                intent="danger"
                role={fieldState.error ? "alert" : undefined}
              >
                {fieldState.error?.message}
              </FieldFeedback>
            </Field>
          );
        }}
      />
    </QuestionnaireItem>
  );
}
