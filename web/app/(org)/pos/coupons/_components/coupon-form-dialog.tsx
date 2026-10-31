"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { Input } from "@/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { Switch } from "@/components/switch";
import type { Coupon } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { zodResolver } from "@/lib/utils/zod-resolver";

const DISCOUNT_TYPES = ["percent", "fixed"] as const;

function useCouponFormSchema() {
  const t = useTranslations("Pos");
  return z.object({
    code: z.string().trim().min(1, t("validationCodeRequired")),
    discountType: z.enum(DISCOUNT_TYPES),
    discountValue: z.coerce.number().positive(t("validationValueRequired")),
    usageLimit: z.coerce.number().int().min(0).nullable(),
    expiryDate: z.string().nullable(),
    active: z.boolean(),
  });
}

function toDefaultValues(initial?: Coupon | null) {
  return initial
    ? {
        code: initial.code,
        discountType: initial.discountType,
        discountValue: initial.discountValue,
        usageLimit: initial.usageLimit,
        expiryDate: initial.expiryDate ? initial.expiryDate.toISOString().slice(0, 10) : null,
        active: initial.active,
      }
    : {
        code: "",
        discountType: "percent" as const,
        discountValue: 0,
        usageLimit: null,
        expiryDate: null,
        active: true,
      };
}

export function CouponFormDialog({
  open,
  onOpenChange,
  orgId,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  initial?: Coupon | null;
  onSave: () => void;
}) {
  const isEdit = Boolean(initial);
  const t = useTranslations("Pos");
  const tCommon = useTranslations("Common");

  const schema = useCouponFormSchema();
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toDefaultValues(initial),
  });

  useEffect(() => {
    if (open) {
      form.reset(toDefaultValues(initial));
    }
  }, [open, initial, form]);

  function handleSubmit(values: Values) {
    const request = {
      code: values.code,
      discountType: values.discountType,
      discountValue: values.discountValue,
      usageLimit: values.usageLimit,
      expiryDate: values.expiryDate,
      active: values.active,
    };

    if (isEdit && initial) {
      return getSwantaraService()
        .coupons.update(Number(orgId), initial.id, request)
        .then(() => {
          toast.success(t("couponUpdated"));
          onSave();
        })
        .catch(() => void toast.error(t("saveFailed")));
    }

    return getSwantaraService()
      .coupons.create(Number(orgId), { ...request, organizationId: Number(orgId) })
      .then(() => {
        toast.success(t("couponCreated"));
        onSave();
      })
      .catch(() => void toast.error(t("saveFailed")));
  }

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t("editCoupon") : t("newCoupon")}
      description={t("couponFormDescription")}
      form={form}
      onSubmit={handleSubmit}
      submitLabel={tCommon("save")}
      cancelLabel={tCommon("cancel")}
      className="sm:max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <FormField name="code" label={t("fieldCode")}>
          {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldCode")} />}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="discountType" label={t("fieldDiscountType")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("fieldDiscountType")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`discountType_${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="discountValue" label={t("fieldDiscountValue")}>
            {({ field, id }) => (
              <Input {...field} id={id} type="number" step="any" min="0" value={field.value} />
            )}
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="usageLimit" label={t("fieldUsageLimit")}>
            {({ field, id }) => (
              <Input
                {...field}
                id={id}
                type="number"
                min="0"
                value={field.value ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  field.onChange(value === "" ? null : Number(value));
                }}
              />
            )}
          </FormField>
          <FormField name="expiryDate" label={t("fieldExpiryDate")}>
            {({ field, id }) => (
              <Input
                id={id}
                type="date"
                value={field.value ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  field.onChange(value === "" ? null : value);
                }}
              />
            )}
          </FormField>
        </div>
        <FormField name="active" label={t("fieldActive")}>
          {({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(Boolean(checked))}
              aria-label={t("fieldActive")}
            />
          )}
        </FormField>
      </div>
    </EntityFormDialog>
  );
}
