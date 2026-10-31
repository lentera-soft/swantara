"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { Controller, FormProvider } from "react-hook-form";
import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { FieldFeedback } from "@/components/field-feedback";
import { SubmitButton } from "@/components/form";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Password } from "@/components/password";

import { useLoginForm } from "../_hooks/use-login-form";

export default function LoginForm() {
  const { form, handleSubmit, isPending } = useLoginForm({});
  const t = useTranslations("Auth");
  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = `${emailId}-error`;
  const passwordErrorId = `${passwordId}-error`;

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} noValidate aria-busy={isPending}>
        <div className="flex flex-col gap-y-4">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => {
              const errorId = fieldState.error ? emailErrorId : undefined;
              return (
                <Field className="flex-1">
                  <Label htmlFor={emailId}>{t("email")}</Label>
                  <Input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder={"johndoe@mail.com"}
                    aria-invalid={Boolean(fieldState.error)}
                    aria-describedby={errorId}
                    {...field}
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
            name="password"
            control={form.control}
            render={({ field, fieldState }) => {
              const errorId = fieldState.error ? passwordErrorId : undefined;
              return (
                <Field className="flex-1">
                  <Label htmlFor={passwordId}>{t("password")}</Label>
                  <Password
                    id={passwordId}
                    autoComplete="current-password"
                    aria-invalid={Boolean(fieldState.error)}
                    aria-describedby={errorId}
                    {...field}
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
        <div className="mt-2 flex justify-end">
          <Link
            className="inline-flex min-h-12 items-center rounded-md px-2 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/forgot-password"
          >
            {t("forgotPassword")}
          </Link>
        </div>
        <div className="mt-6 sm:mt-8">
          <SubmitButton className="w-full" loading={isPending} variant="default" size="lg">
            {t("loginButton")}
          </SubmitButton>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Button type="button" variant="outline" className="w-full">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
          <Button type="button" variant="outline" className="w-full">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
              <path
                fill="#1877F2"
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
            Continue with Facebook
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
