"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import { Field } from "@/components/field";
import { FieldFeedback } from "@/components/field-feedback";
import { Button } from "@/components/button";
import { SubmitButton } from "@/components/form";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Password } from "@/components/password";

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
                <Input
                  id={phoneId}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+6281234567890"
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
          <PasswordField name="password" label={t("password")} />
          <PasswordField name="passwordConfirmation" label={t("confirmPassword")} />
        </div>
        <div className="mt-8 flex flex-col">
          <SubmitButton variant="default" size="lg" loading={formState.isSubmitting}>
            {t("registerButton")}
          </SubmitButton>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Button type="button" variant="outline" className="w-full">
            Continue with Google
          </Button>
          <Button type="button" variant="outline" className="w-full">
            Continue with Facebook
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
