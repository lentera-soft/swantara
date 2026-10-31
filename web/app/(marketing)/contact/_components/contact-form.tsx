"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Textarea } from "@/components/textarea";
import { submitContactInquiry } from "@/lib/services/contact-inquiry";
import {
  CONTACT_DEFAULT_VALUES,
  type ContactInquiryFormValues,
  contactInquiryFormSchema,
} from "./contact-utils";

export function ContactForm() {
  const t = useTranslations("Marketing.contact");
  const baseId = useId();
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");

  const form = useForm<ContactInquiryFormValues>({
    resolver: zodResolver(contactInquiryFormSchema),
    defaultValues: CONTACT_DEFAULT_VALUES,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: ContactInquiryFormValues) {
    setSubmitState("idle");
    try {
      await submitContactInquiry({
        name: values.name,
        email: values.email,
        company: values.company ? values.company : null,
        message: values.message,
      });
      setSubmitState("success");
      reset(CONTACT_DEFAULT_VALUES);
    } catch {
      setSubmitState("error");
    }
  }

  return (
    <form
      data-slot="contact-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${baseId}-name`} className="text-sm font-medium text-foreground">
            {t("name")}
          </Label>
          <Input
            id={`${baseId}-name`}
            placeholder={t("namePlaceholder")}
            aria-invalid={Boolean(errors.name)}
            className="rounded-xl"
            {...register("name")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${baseId}-email`} className="text-sm font-medium text-foreground">
            {t("email")}
          </Label>
          <Input
            id={`${baseId}-email`}
            type="email"
            placeholder={t("emailPlaceholder")}
            aria-invalid={Boolean(errors.email)}
            className="rounded-xl"
            {...register("email")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${baseId}-company`} className="text-sm font-medium text-foreground">
          {t("company")}
        </Label>
        <Input
          id={`${baseId}-company`}
          placeholder={t("companyPlaceholder")}
          className="rounded-xl"
          {...register("company")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${baseId}-message`} className="text-sm font-medium text-foreground">
          {t("message")}
        </Label>
        <Textarea
          id={`${baseId}-message`}
          rows={5}
          placeholder={t("messagePlaceholder")}
          aria-invalid={Boolean(errors.message)}
          className="rounded-xl"
          {...register("message")}
        />
      </div>

      {submitState === "success" ? (
        <div
          role="status"
          className="rounded-xl border border-success/40 bg-success/10 p-4 text-sm text-foreground"
        >
          {t("success")}
        </div>
      ) : null}

      {submitState === "error" ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {t("error")}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4">
        <span className="text-sm text-muted-foreground">{t("responseTime")}</span>
        <Button type="submit" size="lg" disabled={isSubmitting} className="rounded-full px-6">
          <span>{isSubmitting ? t("sending") : t("submit")}</span>
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </form>
  );
}
