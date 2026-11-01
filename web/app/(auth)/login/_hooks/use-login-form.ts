"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { StatusCodes } from "http-status-codes";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ME_ORGANIZATIONS_QUERY_KEY, ME_QUERY_KEY } from "@/lib/queries/me";
import { login } from "@/lib/services/auth-client";
import { SwantaraError } from "@/lib/services/swantara/errors";
import { useDigitalFingerprintStore } from "@/stores/digital-fingerprint.store";

export type LoginFormMessages = {
  emailRequired: string;
  passwordRequired: string;
};

const loginFormDefaultMessages: LoginFormMessages = {
  emailRequired: "Email wajib diisi.",
  passwordRequired: "Kata sandi wajib diisi",
};

export function useLoginFormSchema(messages: LoginFormMessages = loginFormDefaultMessages) {
  return z.object({
    email: z.string().min(1, { message: messages.emailRequired }),
    password: z.string().min(1, { message: messages.passwordRequired }),
    rememberMe: z.boolean().optional(),
  });
}

export type LoginFormsSchema = z.infer<ReturnType<typeof useLoginFormSchema>>;

const loginFormDefaultValues: LoginFormsSchema = {
  email: "",
  password: "",
  rememberMe: false,
};

export type UseLoginFormParams = {
  defaultValues?: LoginFormsSchema;
};

export function useLoginForm({ defaultValues = loginFormDefaultValues }: UseLoginFormParams) {
  const [isPending, startTransition] = useTransition();
  useDigitalFingerprintStore((state) => state.fingerprint);
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const tx = t as unknown as (key: string) => string;
  const txCommon = tCommon as unknown as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const loginFormSchema = useLoginFormSchema({
    emailRequired: tx("emailRequired"),
    passwordRequired: tx("passwordRequired"),
  });

  const form = useForm<LoginFormsSchema>({
    resolver: zodResolver(loginFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof PasswordCredential === "undefined") return;
    if (!navigator.credentials?.get) return;

    navigator.credentials
      .get({ password: true, mediation: "optional" } as CredentialRequestOptions)
      .then((credential) => {
        if (credential instanceof PasswordCredential) {
          form.setValue("email", credential.id, {
            shouldDirty: true,
            shouldTouch: true,
          });
          form.setValue("password", credential.password, {
            shouldDirty: true,
            shouldTouch: true,
          });
        }
      })
      .catch(() => {});
  }, [form]);

  const handleSubmit = form.handleSubmit((data: LoginFormsSchema) => {
    startTransition(async () => {
      try {
        await login(data);
        if (typeof PasswordCredential !== "undefined" && navigator.credentials?.store) {
          try {
            const credential = new PasswordCredential({
              id: data.email,
              password: data.password,
              name: data.email,
            });
            await navigator.credentials.store(credential);
          } catch {}
        }
        queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
        queryClient.invalidateQueries({
          queryKey: ME_ORGANIZATIONS_QUERY_KEY,
        });
        router.push("/onboarding");
      } catch (error: unknown) {
        const status = error instanceof SwantaraError ? error.status : 0;
        if (!status) {
          toast.error(txCommon("networkError"));
          return;
        }
        if (status === StatusCodes.UNAUTHORIZED) {
          toast.error(tx("invalidCredentials"));
          return;
        }
        if (status === StatusCodes.TOO_MANY_REQUESTS) {
          const seconds =
            error instanceof SwantaraError ? (error.retryAfterSeconds ?? undefined) : undefined;
          toast.warning(txCommon("rateLimited"), {
            description: seconds ? txCommon("retryInSeconds", { seconds }) : undefined,
          });
          return;
        }
        if (status >= StatusCodes.INTERNAL_SERVER_ERROR) {
          toast.error(txCommon("serverError"));
          return;
        }
        toast.error(tx("loginFailed"));
      }
    });
  });

  return {
    isPending,
    handleSubmit,
    form,
  };
}
