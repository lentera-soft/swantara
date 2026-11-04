import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { StatusCodes } from "http-status-codes";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ME_ORGANIZATIONS_QUERY_KEY, ME_QUERY_KEY } from "@/lib/queries/me";
import { login, register } from "@/lib/services/auth-client";
import { SwantaraError, SwantaraUnprocessableError } from "@/lib/services/swantara/errors";
import {
  type RegisterFormSchema,
  registerFormDefaultValues,
  useRegisterFormSchema,
} from "./register-form-schema";

export function useRegisterForm({
  defaultValues = registerFormDefaultValues,
}: UseRegisterFormParams) {
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const tx = t as unknown as (key: string) => string;
  const txCommon = tCommon as unknown as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const registerFormSchema = useRegisterFormSchema({
    firstNameRequired: tx("firstNameRequired"),
    lastNameRequired: tx("lastNameRequired"),
    invalidEmail: tx("invalidEmail"),
    emailRequired: tx("emailRequired"),
    invalidPhone: tx("invalidPhone"),
    passwordMinLength: tx("passwordMinLength"),
    confirmPasswordMinLength: tx("confirmPasswordMinLength"),
    passwordMismatch: tx("passwordMismatch"),
  });
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<RegisterFormSchema>({
    resolver: zodResolver(registerFormSchema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (data: RegisterFormSchema) => {
    const { confirmPassword: _confirmPassword, ...payload } = data;
    try {
      await register(payload);
      try {
        await login({
          email: data.email.trim(),
          password: data.password,
        });
      } catch {
        router.push("/login");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ME_ORGANIZATIONS_QUERY_KEY });
      router.push("/onboarding");
      return;
    } catch (error: unknown) {
      if (error instanceof SwantaraError) {
        const status = error.status;
        const message = error.message.toLowerCase();
        const isEmailTaken =
          status === StatusCodes.CONFLICT ||
          (status === StatusCodes.UNPROCESSABLE_ENTITY && message.includes("already registered"));
        const isPhoneTaken =
          status === StatusCodes.CONFLICT ||
          (status === StatusCodes.UNPROCESSABLE_ENTITY && message.includes("phone"));

        if (isPhoneTaken) {
          form.setError("phone", { message: tx("phoneTaken") });
          return;
        }

        if (isEmailTaken) {
          form.setError("email", { message: tx("emailTaken") });
          return;
        }

        if (status === 0) {
          toast.error(txCommon("networkError"));
          return;
        }

        if (status === StatusCodes.TOO_MANY_REQUESTS) {
          const seconds = error.retryAfterSeconds ?? undefined;
          toast.warning(txCommon("rateLimited"), {
            description: seconds ? txCommon("retryInSeconds", { seconds }) : undefined,
          });
          return;
        }

        if (status >= StatusCodes.INTERNAL_SERVER_ERROR) {
          toast.error(txCommon("serverError"));
          return;
        }

        if (error instanceof SwantaraUnprocessableError && error.fieldErrors?.length) {
          for (const fieldError of error.fieldErrors) {
            const field = fieldError.field as keyof RegisterFormSchema;
            if (field in registerFormDefaultValues) {
              form.setError(field, { message: fieldError.message });
            }
          }
          toast.error(error.message);
          return;
        }

        if (status === StatusCodes.BAD_REQUEST || status === StatusCodes.UNPROCESSABLE_ENTITY) {
          if (message.includes("phone")) {
            form.setError("phone", { message: tx("phoneTaken") });
          } else {
            toast.error(error.message);
          }
          return;
        }
      }

      form.setError("email", { message: tx("registrationFailed") });
      return;
    }
  });

  return {
    form,
    handleSubmit,
  };
}

export type { RegisterFormSchema };
export { useRegisterFormSchema };
export type UseRegisterFormParams = {
  defaultValues?: RegisterFormSchema;
};
