"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { DetailPageSkeleton } from "@/components/detail-page-skeleton";
import { Form, FormField, SubmitButton } from "@/components/form";
import { Input } from "@/components/input";
import { PageHeader } from "@/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { Switch } from "@/components/switch";
import { Textarea } from "@/components/textarea";
import { useOrgQuery } from "@/lib/hooks/use-org-query";
import type { PaymentTermLineResponse, PaymentTermResponse } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { logger } from "@/lib/utils/client-logger";

export const PAYMENT_TERMS_HREF = "/reference/payment-terms";

const lineValueTypes = ["percent", "fixed", "balance"] as const;
type LineValueType = (typeof lineValueTypes)[number];

type LineValues = {
  id: string;
  valueType: LineValueType;
  value: string;
  daysAfter: string;
  dayOfMonth: string;
  discountPct: string;
  discountDays: string;
};

type Values = {
  code: string;
  name: string;
  isActive: boolean;
  note: string;
  lines: LineValues[];
};

function emptyLine(): LineValues {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    valueType: "percent",
    value: "",
    daysAfter: "0",
    dayOfMonth: "",
    discountPct: "",
    discountDays: "",
  };
}

function toLineValues(line: PaymentTermLineResponse): LineValues {
  return {
    id: String(line.id),
    valueType: line.valueType,
    value: String(line.value),
    daysAfter: String(line.daysAfter),
    dayOfMonth: line.dayOfMonth != null ? String(line.dayOfMonth) : "",
    discountPct: line.discountPct != null ? String(line.discountPct) : "",
    discountDays: line.discountDays != null ? String(line.discountDays) : "",
  };
}

function toValues(term: PaymentTermResponse): Values {
  return {
    code: term.code ?? "",
    name: term.name,
    isActive: term.isActive ?? true,
    note: term.note ?? "",
    lines: term.lines.map(toLineValues),
  };
}

function initialValues(term?: PaymentTermResponse): Values {
  if (term) return toValues(term);
  return {
    code: "",
    name: "",
    isActive: true,
    note: "",
    lines: [emptyLine()],
  };
}

export function PaymentTermForm({
  orgId,
  initial,
}: {
  orgId: string;
  initial?: PaymentTermResponse;
}) {
  const t = useTranslations("Reference");
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(initial);

  const lineSchema = z
    .object({
      id: z.string(),
      valueType: z.enum(lineValueTypes),
      value: z.string(),
      daysAfter: z.string().min(1, t("validationDueDaysRequired")),
      dayOfMonth: z.string(),
      discountPct: z.string(),
      discountDays: z.string(),
    })
    .superRefine((line, ctx) => {
      if (line.valueType === "balance") return;
      if (line.value === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: t("validationValueRequired"),
        });
      } else if (!(Number(line.value) > 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: t("validationValuePositive"),
        });
      }
      const daysAfter = Number(line.daysAfter);
      if (line.daysAfter !== "" && (!Number.isInteger(daysAfter) || daysAfter < 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["daysAfter"],
          message: t("validationDaysAfterNonnegative"),
        });
      }
      if (line.dayOfMonth !== "") {
        const dayOfMonth = Number(line.dayOfMonth);
        if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["dayOfMonth"],
            message: t("validationDayOfMonth"),
          });
        }
      }
      if (line.discountPct !== "") {
        const discountPct = Number(line.discountPct);
        if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["discountPct"],
            message: t("validationDiscountPct"),
          });
        }
      }
      if (line.discountDays !== "") {
        const discountDays = Number(line.discountDays);
        if (!Number.isInteger(discountDays) || discountDays < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["discountDays"],
            message: t("validationDiscountDays"),
          });
        }
      }
    });

  const schema = z
    .object({
      name: z.string().min(1, t("validationNameRequired")),
      code: z.string(),
      isActive: z.boolean(),
      note: z.string(),
      lines: z.array(lineSchema).min(1, t("validationAddAtLeastOneLine")),
    })
    .superRefine((values, ctx) => {
      const balanceCount = values.lines.filter((line) => line.valueType === "balance").length;
      if (balanceCount > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines"],
          message: t("validationOnlyOneBalance"),
        });
      }
      const percentTotal = values.lines
        .filter((line) => line.valueType === "percent")
        .reduce((sum, line) => sum + (Number(line.value) || 0), 0);
      if (
        balanceCount === 0 &&
        values.lines.every((line) => line.valueType === "percent") &&
        Math.abs(percentTotal - 100) > 0.001
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines"],
          message: t("validationPercentTotal", { total: String(percentTotal) }),
        });
      }
    });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initialValues(initial),
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });
  const lineValues = form.watch("lines");

  const saveMutation = useMutation({
    mutationFn: (payload: Values) => {
      const request = {
        name: payload.name,
        code: payload.code.trim() || null,
        isActive: payload.isActive,
        templateKey: null,
        note: payload.note.trim() || null,
        lines: payload.lines.map((line, index) => ({
          sequence: index + 1,
          valueType: line.valueType,
          value: line.valueType === "balance" ? 0 : Number(line.value),
          daysAfter: Number(line.daysAfter),
          dayOfMonth: line.dayOfMonth === "" ? null : Number(line.dayOfMonth),
          discountPct: line.discountPct === "" ? null : Number(line.discountPct),
          discountDays: line.discountDays === "" ? null : Number(line.discountDays),
        })),
      };
      return initial
        ? getSwantaraService().paymentTerms.update(Number(orgId), initial.id, request)
        : getSwantaraService().paymentTerms.create(Number(orgId), request);
    },
    onSuccess: () => {
      toast.success(t("paymentTermSaved"));
      void queryClient.invalidateQueries({ queryKey: ["paymentTerms"] });
      void queryClient.invalidateQueries({ queryKey: ["paymentTermDetail"] });
      router.push(PAYMENT_TERMS_HREF);
    },
    onError: (error) => {
      logger.error("Failed to save payment term", error);
      toast.error(t("toastFailedSave"));
    },
  });

  return (
    <div className="mx-auto flex w-full flex flex-col gap-y-8">
      <PageHeader
        force
        title={isEdit ? t("editTerm") : t("newTerm")}
        description={t("paymentTermDialogDescription")}
      />
      <Form
        form={form}
        onSubmit={(values) => saveMutation.mutate(values)}
        className="flex flex-col gap-5 sm:gap-6"
      >
        <Card>
          <CardContent className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <FormField name="name" label={t("fieldName")}>
              {({ field, id }) => (
                <Input
                  {...field}
                  id={id}
                  placeholder={t("fieldName")}
                  autoFocus
                  autoComplete="off"
                />
              )}
            </FormField>
            <FormField name="code" label={t("fieldCode")}>
              {({ field, id }) => (
                <Input {...field} id={id} placeholder={t("fieldCode")} autoComplete="off" />
              )}
            </FormField>
            <FormField  name="note" label={t("fieldNote")} className="col-span-2">
              {({ field, id }) => (
                <Textarea {...field} id={id} placeholder={t("fieldNote")} rows={3} />
              )}
            </FormField>
            <FormField name="isActive" label={t("fieldActive")}>
              {({ field, id }) => (
                <div className="flex h-9 items-center justify-between gap-3 rounded-md border px-3">
                  <span className="text-sm text-muted-foreground">
                    {t("activeTermDescription")}
                  </span>
                  <Switch
                    id={id}
                    aria-label={t("fieldActive")}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>{t("schedule")}</CardTitle>
              <CardDescription>{t("paymentScheduleDescription")}</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => append(emptyLine())}>
              <Plus />
              <span>{t("addLine")}</span>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {form.formState.errors.lines?.message ? (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.lines.message}
              </p>
            ) : null}
            {fields.map((line, index) => {
              const values = lineValues[index]!;
              const lineError = form.formState.errors.lines?.[index];
              const prefix = `${t("lineNumber", { number: index + 1 })} · `;
              const field = (
                label: string,
                key: "value" | "daysAfter" | "dayOfMonth" | "discountPct" | "discountDays",
                options?: { step?: string; min?: string; placeholder?: string },
              ) => {
                const error = lineError?.[key]?.message;
                const id = `payment-term-line-${index}-${key}`;
                return (
                  <div className="flex min-w-0 flex-col gap-1.5" key={key}>
                    <label htmlFor={id} className="text-sm font-medium">
                      {label}
                    </label>
                    <Input
                      id={id}
                      type="number"
                      step={options?.step ?? "1"}
                      min={options?.min}
                      placeholder={options?.placeholder}
                      inputMode={options?.step === "any" ? "decimal" : "numeric"}
                      aria-label={`${prefix}${label}`}
                      aria-invalid={Boolean(error)}
                      value={values[key]}
                      onChange={(event) =>
                        form.setValue(`lines.${index}.${key}`, event.target.value, {
                          shouldDirty: true,
                          shouldValidate: form.formState.isSubmitted,
                        })
                      }
                    />
                    {error ? (
                      <p role="alert" className="text-xs text-destructive">
                        {error}
                      </p>
                    ) : null}
                  </div>
                );
              };

              return (
                <section key={line.id} className="rounded-lg border bg-background p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="text-sm font-medium">
                          {t("lineNumber", { number: index + 1 })}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {t("lineSequenceHint", { sequence: index + 1 })}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${t("removeLine")} ${index + 1}`}
                      onClick={() => remove(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <label
                        htmlFor={`payment-term-line-${index}-type`}
                        className="text-sm font-medium"
                      >
                        {t("fieldType")}
                      </label>
                      <Select
                        value={values.valueType}
                        onValueChange={(value) =>
                          form.setValue(
                            `lines.${index}.valueType`,
                            (value ?? "percent") as LineValueType,
                            { shouldDirty: true, shouldValidate: form.formState.isSubmitted },
                          )
                        }
                      >
                        <SelectTrigger
                          id={`payment-term-line-${index}-type`}
                          aria-label={`${prefix}${t("fieldType")}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {lineValueTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {(t as unknown as (k: string) => string)(`type_${type}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {field(t("fieldValue"), "value", {
                      step: "any",
                      min: "0",
                      placeholder: t("placeholderValue"),
                    })}
                    {field(t("fieldDueDays"), "daysAfter", {
                      min: "0",
                      placeholder: t("placeholderDueDays"),
                    })}
                    {field(t("fieldDayOfMonth"), "dayOfMonth", {
                      min: "1",
                      placeholder: t("placeholderDayOfMonth"),
                    })}
                    {field(t("fieldDiscountPct"), "discountPct", {
                      step: "any",
                      min: "0",
                      placeholder: t("placeholderDiscountPct"),
                    })}
                    {field(t("fieldDiscountDays"), "discountDays", {
                      min: "0",
                      placeholder: t("placeholderDiscountDays"),
                    })}
                  </div>
                </section>
              );
            })}
          </CardContent>
        </Card>

        <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <Button type="button" variant="outline" disabled={saveMutation.isPending} asChild>
            <Link href={PAYMENT_TERMS_HREF}>{t("actionCancel")}</Link>
          </Button>
          <SubmitButton loading={saveMutation.isPending} disabled={saveMutation.isPending}>
            {t("saveTerm")}
          </SubmitButton>
        </div>
      </Form>
    </div>
  );
}

export function PaymentTermFormEdit({ orgId, termId }: { orgId: string; termId: string }) {
  const t = useTranslations("Reference");

  const recordQuery = useOrgQuery<{ paymentTerm: PaymentTermResponse }>(
    "paymentTermDetail",
    termId,
    (organizationId) => getSwantaraService().paymentTerms.get(organizationId, Number(termId)),
  );

  if (recordQuery.isLoading) {
    return <DetailPageSkeleton />;
  }

  if (recordQuery.error) {
    return <p className="text-sm text-destructive">{recordQuery.error.message}</p>;
  }

  if (!recordQuery.data) {
    return <p className="text-sm text-muted-foreground">{t("recordNotFound")}</p>;
  }

  return <PaymentTermForm orgId={orgId} initial={recordQuery.data.paymentTerm} />;
}
