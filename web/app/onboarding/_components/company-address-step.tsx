"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Field } from "@/components/field";
import { FieldFeedback } from "@/components/field-feedback";
import { Label } from "@/components/label";
import {
  QuestionnaireDescription,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireTitle,
} from "@/components/questionnaire";
import { Textarea } from "@/components/textarea";
import type { OnboardingFormSchema } from "../_hooks/use-onboarding-form";

export function CompanyAddressStep() {
  const { control } = useFormContext<OnboardingFormSchema>();
  const t = useTranslations("Onboarding");
  const tx = t as unknown as (key: string) => string;
  const addressId = useId();
  const cityId = useId();
  const postalCodeId = useId();

  return (
    <QuestionnaireItem name="companyAddress">
      <QuestionnaireTitle className="font-heading text-2xl leading-tight font-medium tracking-tight">
        {tx("companyAddressTitle")}
      </QuestionnaireTitle>
      <QuestionnaireDescription className="mt-0">
        {tx("companyAddressDescription")}
      </QuestionnaireDescription>
      <Controller
        name="address"
        control={control}
        render={({ field, fieldState }) => {
          const errorId = fieldState.error ? `${addressId}-error` : undefined;
          const { value, onChange, onBlur, ref } = field;
          return (
            <Field>
              <Label htmlFor={addressId}>{tx("companyAddress")}</Label>
              <Textarea
                id={addressId}
                autoComplete="street-address"
                placeholder={tx("companyAddressPlaceholder")}
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="city"
          control={control}
          render={({ field, fieldState }) => {
            const errorId = fieldState.error ? `${cityId}-error` : undefined;
            const { value, onChange, onBlur, ref } = field;
            return (
              <Field>
                <Label htmlFor={cityId}>{tx("city")}</Label>
                <QuestionnaireInput
                  id={cityId}
                  type="text"
                  autoComplete="address-level2"
                  placeholder={tx("cityPlaceholder")}
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
          name="postalCode"
          control={control}
          render={({ field, fieldState }) => {
            const errorId = fieldState.error ? `${postalCodeId}-error` : undefined;
            const { value, onChange, onBlur, ref } = field;
            return (
              <Field>
                <Label htmlFor={postalCodeId}>{tx("postalCode")}</Label>
                <QuestionnaireInput
                  id={postalCodeId}
                  type="text"
                  autoComplete="postal-code"
                  placeholder={tx("postalCodePlaceholder")}
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
      </div>
      <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        {tx("companyAddressSkipNote")}
      </p>
    </QuestionnaireItem>
  );
}
