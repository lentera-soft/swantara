"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/button";
import { Form, FormField, SubmitButton } from "@/components/form";
import { Input } from "@/components/input";
import { PageHeader } from "@/components/page-header";
import type { Warehouse } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";

const WAREHOUSES_HREF = "/stock/warehouses";

type TFn = (key: string, values?: Record<string, string | number>) => string;

function useWarehouseFormSchema() {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Stock");
  return z.object({
    name: z.string().min(1, t("validationWarehouseNameRequired")),
    code: z.string(),
    line1: z.string(),
    line2: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    countryCode: z.string(),
  });
}

export function WarehouseForm({
  orgId,
  initial,
  cancelHref = WAREHOUSES_HREF,
}: {
  orgId: string;
  initial?: Warehouse | null;
  cancelHref?: string;
}) {
  const t = (useTranslations as unknown as (ns: string) => TFn)("Stock");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(initial);

  const schema = useWarehouseFormSchema();
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          name: initial.name,
          code: initial.code || "",
          line1: initial.line1 || "",
          line2: initial.line2 || "",
          city: initial.city || "",
          state: initial.state || "",
          postalCode: initial.postalCode || "",
          countryCode: initial.countryCode || "",
        }
      : {
          name: "",
          code: "",
          line1: "",
          line2: "",
          city: "",
          state: "",
          postalCode: "",
          countryCode: "",
        },
  });

  const saveMutation = useMutation({
    mutationFn: (values: Values) => {
      const request = {
        organizationId: Number(orgId),
        name: values.name,
        code: values.code || null,
        line1: values.line1 || null,
        line2: values.line2 || null,
        city: values.city || null,
        state: values.state || null,
        postalCode: values.postalCode || null,
        countryCode: values.countryCode || null,
      };

      if (isEdit && initial) {
        return getSwantaraService().inventory.updateWarehouse(Number(orgId), initial.id, request);
      }
      return getSwantaraService().inventory.createWarehouse(Number(orgId), request);
    },
    onSuccess: (result) => {
      toast.success(isEdit ? t("warehouseUpdated") : t("warehouseCreated"));
      void queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      router.push(
        isEdit && initial
          ? `${WAREHOUSES_HREF}/${initial.id}`
          : `${WAREHOUSES_HREF}/${result.warehouse.id}`,
      );
    },
    onError: () => {
      toast.error(t("toastWarehouseFailed"));
    },
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        force
        title={isEdit ? t("editWarehouse") : t("newWarehouse")}
        description={t("warehousesDescription")}
      />
      <Form
        form={form}
        onSubmit={(values) => saveMutation.mutate(values)}
        className="flex flex-col gap-4"
      >
        <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm">{t("sectionGeneral")}</legend>
          <FormField name="name" label={t("fieldName")} className="sm:col-span-2">
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldName")} autoFocus />}
          </FormField>
          <FormField name="code" label={t("fieldCode")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldCode")} />}
          </FormField>
        </fieldset>

        <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm">{t("sectionAddress")}</legend>
          <FormField name="line1" label={t("fieldAddress1")} className="sm:col-span-2">
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldAddress1")} />}
          </FormField>
          <FormField name="line2" label={t("fieldAddress2")} className="sm:col-span-2">
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldAddress2")} />}
          </FormField>
          <FormField name="city" label={t("fieldCity")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldCity")} />}
          </FormField>
          <FormField name="state" label={t("fieldState")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldState")} />}
          </FormField>
          <FormField name="postalCode" label={t("fieldPostalCode")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldPostalCode")} />}
          </FormField>
          <FormField name="countryCode" label={t("fieldCountryCode")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldCountryCode")} />}
          </FormField>
        </fieldset>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" disabled={saveMutation.isPending} asChild>
            <Link href={cancelHref}>{tCommon("cancel")}</Link>
          </Button>
          <SubmitButton loading={saveMutation.isPending} disabled={saveMutation.isPending}>
            {isEdit ? tCommon("save") : t("addWarehouse")}
          </SubmitButton>
        </div>
      </Form>
    </div>
  );
}
