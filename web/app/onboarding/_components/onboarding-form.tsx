"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { FormProvider } from "react-hook-form";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
} from "@/components/questionnaire";
import { useOnboardingFormStore } from "../_hooks/onboarding-form-store";
import { useOnboardingForm } from "../_hooks/use-onboarding-form";
import { CompanyAddressStep } from "./company-address-step";
import { CompanyInfoStep } from "./company-info-step";
import { ONBOARDING_ITEMS } from "./onboarding-utils";

export default function OnboardingForm() {
  const { form, handleItemChange, handleSubmit } = useOnboardingForm({});
  const t = useTranslations("Onboarding");
  const tx = t as unknown as (key: string, values?: Record<string, string | number>) => string;
  const step = useOnboardingFormStore((s) => s.step);
  const isPending = useOnboardingFormStore((s) => s.isPending);

  const stepIndex = ONBOARDING_ITEMS.findIndex((item) => item.name === step);
  const nextStep = stepIndex >= 0 ? ONBOARDING_ITEMS[stepIndex + 1]?.name : undefined;
  const isLastStep = stepIndex === ONBOARDING_ITEMS.length - 1;

  return (
    <FormProvider {...form}>
      <div
        data-slot="onboarding-card"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg sm:p-10"
      >
        <p className="mb-6 text-label uppercase text-muted-foreground">
          {tx("stepOf", { current: stepIndex + 1, total: ONBOARDING_ITEMS.length })}
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
          <CompanyAddressStep />
          <QuestionnaireActions className="mt-8 flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <QuestionnairePrevious>{tx("back")}</QuestionnairePrevious>
              <p className="text-xs leading-relaxed text-muted-foreground">{tx("redirectNote")}</p>
            </div>
            <div className="flex items-center gap-2">
              {nextStep ? (
                <QuestionnaireNext
                  onClick={(event) => {
                    event.preventDefault();
                    void handleItemChange(nextStep);
                  }}
                >
                  {tx("next")}
                </QuestionnaireNext>
              ) : null}
              {isLastStep ? (
                <>
                  <QuestionnaireSkip
                    onClick={(event) => {
                      event.preventDefault();
                      void handleSubmit();
                    }}
                  >
                    {tx("skip")}
                  </QuestionnaireSkip>
                  <QuestionnaireSubmit
                    disabled={isPending}
                    className="shrink-0"
                    onClick={(event) => {
                      event.preventDefault();
                      void handleSubmit();
                    }}
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : null}
                    {tx("createCompany")}
                  </QuestionnaireSubmit>
                </>
              ) : null}
            </div>
          </QuestionnaireActions>
        </Questionnaire>
      </div>
    </FormProvider>
  );
}
