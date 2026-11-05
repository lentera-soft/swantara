import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { setActiveOrg } from "@/lib/server/active-org-actions";
import { quickCreateOrganization } from "@/lib/services/auth-client";
import { SwantaraError, SwantaraUnprocessableError } from "@/lib/services/swantara/errors";

import { resolveStandardCode } from "../_components/onboarding-utils";
import {
  type OnboardingFormStore,
  type OnboardingStep,
  useOnboardingFormStore,
} from "./onboarding-form-store";

export type OnboardingFormMessages = {
  nameRequired: string;
  countryRequired: string;
  currencyRequired: string;
};

const onboardingFormDefaultMessages: OnboardingFormMessages = {
  nameRequired: "Company name is required",
  countryRequired: "Country is required",
  currencyRequired: "Currency is required",
};

export function useOnboardingFormSchema(
  messages: OnboardingFormMessages = onboardingFormDefaultMessages,
) {
  return z.object({
    name: z.string().min(1, { message: messages.nameRequired }),
    countryCode: z.string().min(2, { message: messages.countryRequired }),
    currencyCode: z.string().length(3, { message: messages.currencyRequired }),
    address: z.string(),
    city: z.string(),
    postalCode: z.string(),
  });
}

export type OnboardingFormSchema = z.infer<ReturnType<typeof useOnboardingFormSchema>>;

const onboardingFormDefaultValues = {
  name: "",
  countryCode: "",
  currencyCode: "",
  address: "",
  city: "",
  postalCode: "",
} as unknown as OnboardingFormSchema;

const QUICK_CREATE_FIELD_MAP: Record<string, keyof OnboardingFormSchema> = {
  name: "name",
  country_code: "countryCode",
  base_currency: "currencyCode",
  address: "address",
  city: "city",
  postal_code: "postalCode",
};

const stepFields: Record<OnboardingStep, (keyof OnboardingFormSchema)[]> = {
  companyInfo: ["name", "countryCode", "currencyCode"],
  companyAddress: ["address", "city", "postalCode"],
};

const STEP_ORDER: OnboardingStep[] = ["companyInfo", "companyAddress"];

export type UseOnboardingFormParams = {
  defaultValues?: OnboardingFormSchema;
};

export function useOnboardingForm({
  defaultValues = onboardingFormDefaultValues,
}: UseOnboardingFormParams) {
  const t = useTranslations("Onboarding");
  const tCommon = useTranslations("Common");
  const tx = t as unknown as (key: string) => string;
  const txCommon = tCommon as unknown as (key: string) => string;
  const onboardingFormSchema = useOnboardingFormSchema({
    nameRequired: tx("companyNameRequired"),
    countryRequired: tx("countryRequired"),
    currencyRequired: tx("currencyRequired"),
  });
  const router = useRouter();

  const form = useForm<OnboardingFormSchema>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues,
  });

  const handleItemChange = useCallback(
    async (next: string) => {
      const { step, setStep } = useOnboardingFormStore.getState();
      const nextStep = next as OnboardingStep;
      if (nextStep === step) return;
      if (STEP_ORDER.indexOf(nextStep) < STEP_ORDER.indexOf(step)) {
        form.clearErrors();
        setStep(nextStep);
        return;
      }
      const isValid = await form.trigger(stepFields[step]);
      if (!isValid) return;
      form.clearErrors();
      setStep(nextStep);
    },
    [form],
  );

  const quickCreateMutation = useMutation({
    mutationFn: (data: OnboardingFormSchema) => {
      const address = data.address.trim();
      const city = data.city.trim();
      const postalCode = data.postalCode.trim();
      return quickCreateOrganization({
        name: data.name,
        countryCode: data.countryCode,
        standardCode: resolveStandardCode(data.countryCode),
        baseCurrency: data.currencyCode,
        ...(address ? { address } : {}),
        ...(city ? { city } : {}),
        ...(postalCode ? { postalCode } : {}),
      });
    },
    onSuccess: async ({ organization }) => {
      await setActiveOrg(organization.id);
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error: unknown) => {
      if (error instanceof SwantaraUnprocessableError) {
        for (const fieldError of error.fieldErrors ?? []) {
          const target = QUICK_CREATE_FIELD_MAP[fieldError.field];
          if (target) {
            form.setError(target, { message: fieldError.message });
          }
        }
        toast.error(error.message);
        return;
      }
      if (error instanceof SwantaraError && error.status >= 500) {
        toast.error(txCommon("serverError"));
        return;
      }
      if (error instanceof SwantaraError && error.status === 0) {
        toast.error(txCommon("networkError"));
        return;
      }
      if (error instanceof SwantaraError) {
        toast.error(error.message || tx("createFailed"));
      }
      form.setError("name", {
        message: tx("createFailed"),
      });
    },
    onSettled: () => {
      useOnboardingFormStore.getState().setPending(false);
    },
  });

  const handleSubmit = form.handleSubmit((data: OnboardingFormSchema) => {
    useOnboardingFormStore.getState().setPending(true);
    quickCreateMutation.mutate(data);
  });

  return {
    form,
    handleItemChange,
    handleSubmit,
  };
}

export type { OnboardingFormStore, OnboardingStep };
export { useOnboardingFormStore };
