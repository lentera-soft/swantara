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
import { Field } from "@/components/field";
import { FieldFeedback } from "@/components/field-feedback";
import { Label } from "@/components/label";
import {
  QuestionnaireDescription,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireTitle,
} from "@/components/questionnaire";
import type { Country } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import type { OnboardingFormSchema } from "../_hooks/use-onboarding-form";

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

export function CompanyInfoStep() {
  const { control } = useFormContext<OnboardingFormSchema>();
  const t = useTranslations("Onboarding");
  const tx = t as unknown as (key: string) => string;
  const locale = useLocale();
  const nameId = useId();
  const countryId = useId();
  const [countrySearch, setCountrySearch] = useState("");

  const countriesQuery = useQuery({
    queryKey: ["countries", countrySearch],
    queryFn: () =>
      getSwantaraService().countries.list(
        countrySearch ? { filter: [`name:like:${countrySearch}`], size: 100 } : { size: 100 },
      ),
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
      return { code: country.code, name, flag: countryCodeToFlag(country.code) };
    });
  }, [countriesQuery.data, locale]);

  return (
    <QuestionnaireItem name="companyInfo" required>
      <QuestionnaireTitle>{tx("companyInfoTitle")}</QuestionnaireTitle>
      <QuestionnaireDescription>{tx("companyInfoDescription")}</QuestionnaireDescription>
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
                onValueChange={(value) => field.onChange(value ?? "")}
              >
                <ComboboxInput
                  id={countryId}
                  placeholder={tx("selectCountry")}
                  aria-invalid={Boolean(fieldState.error)}
                  aria-describedby={errorId}
                  onChange={(event) => setCountrySearch(event.target.value)}
                />
                <ComboboxContent>
                  <ComboboxList>
                    {(code: string) => {
                      const country = localizedCountries.find((c) => c.code === code);
                      if (!country) return null;
                      return (
                        <ComboboxItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span aria-hidden="true" className="text-base leading-none">
                              {country.flag}
                            </span>
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
    </QuestionnaireItem>
  );
}
