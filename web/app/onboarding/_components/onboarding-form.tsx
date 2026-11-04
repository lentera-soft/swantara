"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { FormProvider } from "react-hook-form";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireProgress,
  QuestionnaireSubmit,
} from "@/components/questionnaire";
import { useOnboardingFormStore } from "../_hooks/onboarding-form-store";
import { useOnboardingForm } from "../_hooks/use-onboarding-form";
import { CompanyInfoStep } from "./company-info-step";
import { ONBOARDING_ITEMS } from "./onboarding-utils";

export default function OnboardingForm() {
  const { form, handleItemChange, handleSubmit } = useOnboardingForm({});
  const t = useTranslations("Onboarding");
  const tx = t as unknown as (key: string, values?: Record<string, string | number>) => string;
  const step = useOnboardingFormStore((s) => s.step);
  const isPending = useOnboardingFormStore((s) => s.isPending);

  return (
    <FormProvider {...form}>
      <div
        data-slot="onboarding-card"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg sm:p-10"
      >
        <p className="mb-6 text-label uppercase text-muted-foreground">
          {tx("stepOf", { current: 1, total: ONBOARDING_ITEMS.length })}
        </p>

        <Questionnaire
          items={ONBOARDING_ITEMS}
          item={step}
          onItemChange={(next) => {
            void handleItemChange(next);
          }}
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          aria-busy={isPending}
        >
          <QuestionnaireProgress />
          <CompanyInfoStep />
          <QuestionnaireActions className="mt-8 flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-muted-foreground">{tx("redirectNote")}</p>
            <QuestionnaireSubmit disabled={isPending} className="shrink-0">
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {tx("createCompany")}
            </QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
      </div>
    </FormProvider>
  );
}
