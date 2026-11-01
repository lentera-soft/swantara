"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { FieldFeedback } from "@/components/field-feedback";
import { SubmitButton } from "@/components/form";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Password } from "@/components/password";
import { PhoneInput } from "@/components/phone-input";

import { type RegisterFormSchema, useRegisterForm } from "../_hooks/use-register-form";

function PasswordField({
  name,
  label,
}: {
  name: "password" | "passwordConfirmation";
  label: string;
}) {
  const { control } = useFormContext<RegisterFormSchema>();
  const t = useTranslations("Auth");
  const tx = t as unknown as (key: string) => string;
  const id = useId();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        return (
          <Field>
            <Label htmlFor={id}>{label}</Label>
            <Password
              id={id}
              autoComplete="new-password"
              aria-invalid={Boolean(fieldState.error)}
              {...field}
            />
            <FieldFeedback
              visible={Boolean(fieldState.error)}
              intent="danger"
              role={fieldState.error ? "alert" : undefined}
            >
              {fieldState.error?.message}
            </FieldFeedback>
            {name === "password" && (
              <p className="text-sm text-muted-foreground">{tx("passwordMinLengthHint")}</p>
            )}
          </Field>
        );
      }}
    />
  );
}

export default function RegisterForm() {
  const { form, handleSubmit } = useRegisterForm({});
  const t = useTranslations("Auth");
  const tx = t as unknown as (key: string) => string;
  const formState = form.formState;
  const control = form.control;

  const firstNameId = "firstName";
  const lastNameId = "lastName";
  const emailId = "email";
  const phoneId = "phone";

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={handleSubmit} className="w-full">
        <div className="animate-fade-up grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <Controller
            name="firstName"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <Label htmlFor={firstNameId}>{tx("firstName")}</Label>
                <Input
                  id={firstNameId}
                  type="text"
                  autoComplete="given-name"
                  placeholder="John"
                  aria-invalid={Boolean(fieldState.error)}
                  {...field}
                />
                <FieldFeedback
                  visible={Boolean(fieldState.error)}
                  intent="danger"
                  role={fieldState.error ? "alert" : undefined}
                >
                  {fieldState.error?.message}
                </FieldFeedback>
              </Field>
            )}
          />
          <Controller
            name="lastName"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <Label htmlFor={lastNameId}>{tx("lastName")}</Label>
                <Input
                  id={lastNameId}
                  type="text"
                  autoComplete="family-name"
                  placeholder="Doe"
                  aria-invalid={Boolean(fieldState.error)}
                  {...field}
                />
                <FieldFeedback
                  visible={Boolean(fieldState.error)}
                  intent="danger"
                  role={fieldState.error ? "alert" : undefined}
                >
                  {fieldState.error?.message}
                </FieldFeedback>
              </Field>
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <Label htmlFor={emailId}>{tx("email")}</Label>
                <Input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  placeholder="johndoe@mail.com"
                  aria-invalid={Boolean(fieldState.error)}
                  {...field}
                />
                <FieldFeedback
                  visible={Boolean(fieldState.error)}
                  intent="danger"
                  role={fieldState.error ? "alert" : undefined}
                >
                  {fieldState.error?.message}
                </FieldFeedback>
              </Field>
            )}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <Label htmlFor={phoneId}>{t("phone")}</Label>
                <PhoneInput
                  id={phoneId}
                  placeholder="+6281234567890"
                  aria-invalid={Boolean(fieldState.error)}
                  value={field.value}
                  onChange={field.onChange}
                />
                <FieldFeedback
                  visible={Boolean(fieldState.error)}
                  intent="danger"
                  role={fieldState.error ? "alert" : undefined}
                >
                  {fieldState.error?.message}
                </FieldFeedback>
              </Field>
            )}
          />
          <PasswordField name="password" label={t("password")} />
          <PasswordField name="passwordConfirmation" label={t("confirmPassword")} />
        </div>
        <div className="mt-8 flex flex-col">
          <SubmitButton variant="default" size="lg" loading={formState.isSubmitting}>
            {t("registerButton")}
          </SubmitButton>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="w-full">
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
          <Button type="button" variant="outline" className="w-full">
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                fill="#1877F2"
              />
            </svg>
            Continue with Facebook
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
