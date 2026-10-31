import { zodResolver } from "@hookform/resolvers/zod";
import { StatusCodes } from "http-status-codes";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/services/auth-client";
import { SwantaraError } from "@/lib/services/swantara/errors";

export const forgotPasswordMethods = ["email", "phone"] as const;
export type ForgotPasswordMethod = (typeof forgotPasswordMethods)[number];

export function detectMethod(identifier: string): ForgotPasswordMethod {
  return identifier.includes("@") ? "email" : "phone";
}

export type ForgotPasswordFormMessages = {
  identifierRequired: string;
  invalidEmail: string;
  invalidPhone: string;
};

const forgotPasswordFormDefaultMessages: ForgotPasswordFormMessages = {
  identifierRequired: "Please enter your email or phone number.",
  invalidEmail: "Please enter a valid email address.",
  invalidPhone: "Please enter a valid phone number.",
};

export function useForgotPasswordFormSchema(
  messages: ForgotPasswordFormMessages = forgotPasswordFormDefaultMessages,
) {
  return z
    .object({
      identifier: z.string().min(1, { message: messages.identifierRequired }),
    })
    .superRefine((value, ctx) => {
      const trimmed = value.identifier.trim();
      if (trimmed.includes("@")) {
        if (!z.email().safeParse(trimmed).success) {
          ctx.addIssue({
            code: "custom",
            path: ["identifier"],
            message: messages.invalidEmail,
          });
        }
        return;
      }
      const digits = trimmed.replace(/[\s-]/g, "");
      if (!/^\+?\d{7,15}$/.test(digits)) {
        ctx.addIssue({
          code: "custom",
          path: ["identifier"],
          message: messages.invalidPhone,
        });
      }
    });
}

export type ForgotPasswordFormSchema = z.infer<ReturnType<typeof useForgotPasswordFormSchema>>;

const forgotPasswordFormDefaultValues: ForgotPasswordFormSchema = {
  identifier: "",
};

export function useForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const tx = t as unknown as (key: string) => string;
  const txCommon = tCommon as unknown as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const forgotPasswordFormSchema = useForgotPasswordFormSchema({
    identifierRequired: tx("identifierRequired"),
    invalidEmail: tx("invalidEmail"),
    invalidPhone: tx("invalidPhone"),
  });

  const form = useForm<ForgotPasswordFormSchema>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: forgotPasswordFormDefaultValues,
  });

  const handleSubmit = form.handleSubmit((data: ForgotPasswordFormSchema) => {
    startTransition(async () => {
      try {
        await requestPasswordReset(data.identifier.trim());
        setIsSubmitted(true);
      } catch (error: unknown) {
        if (error instanceof SwantaraError && error.status === StatusCodes.TOO_MANY_REQUESTS) {
          const seconds = error.retryAfterSeconds ?? undefined;
          toast.warning(txCommon("rateLimited"), {
            description: seconds ? txCommon("retryInSeconds", { seconds }) : undefined,
          });
          return;
        }
        if (error instanceof SwantaraError && error.status >= StatusCodes.INTERNAL_SERVER_ERROR) {
          toast.error(txCommon("serverError"));
          return;
        }
        toast.error(tx("sendResetFailed"));
      }
    });
  });

  return {
    form,
    handleSubmit,
    isPending,
    isSubmitted,
  };
}
