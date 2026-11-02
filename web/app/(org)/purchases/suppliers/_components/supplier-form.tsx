"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { Switch } from "@/components/switch";
import { getSwantaraService } from "@/lib/services/swantara";

const SUPPLIERS_HREF = "/purchases/suppliers";

function useSupplierFormSchema() {
  const t = useTranslations("Contacts");
  return z.object({
    name: z.string().trim().min(1, t("validationNameRequired")),
    displayName: z.string().trim(),
    isOrganization: z.boolean(),
    email: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        t("validationEmailInvalid"),
      ),
    phone: z.string().trim(),
    mobile: z.string().trim(),
    website: z.string().trim(),
    taxId: z.string().trim(),
    industry: z.string().trim(),
    currencyCode: z.string().trim(),
    lang: z.string().trim(),
    active: z.boolean(),
  });
}

export function SupplierForm({ orgId }: { orgId: string }) {
  const t = useTranslations("Purchases");
  const tc = useTranslations("Contacts");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const schema = useSupplierFormSchema();
  type Values = z.infer<typeof schema>;

  const currenciesQuery = useQuery({
    queryKey: ["currencies"],
    queryFn: () => getSwantaraService().currencies.list(),
  });
  const currencyOptions = currenciesQuery.data?.currencies ?? [];

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      displayName: "",
      isOrganization: true,
      email: "",
      phone: "",
      mobile: "",
      website: "",
      taxId: "",
      industry: "",
      currencyCode: "USD",
      lang: "en",
      active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: Values) =>
      getSwantaraService().contacts.create(Number(orgId), {
        organizationId: Number(orgId),
        name: values.name,
        displayName: values.displayName || null,
        isOrganization: values.isOrganization,
        parentId: null,
        email: values.email || null,
        phone: values.phone || null,
        mobile: values.mobile || null,
        website: values.website || null,
        taxId: values.taxId || null,
        industry: values.industry || null,
        currencyCode: values.currencyCode || null,
        lang: values.lang || "en",
        active: values.active,
        addresses: [],
        bankAccounts: [],
        customer: null,
        supplier: {
          vendorPaymentTermId: null,
          payableAccountId: null,
          active: values.active,
        },
      }),
    onSuccess: () => {
      toast.success(t("supplierCreated"));
      router.push(SUPPLIERS_HREF);
    },
    onError: () => {
      toast.error(tc("saveFailed"));
    },
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader force title={t("newSupplierTitle")} description={t("newSupplierDescription")} />
      <Form
        form={form}
        onSubmit={(values) => createMutation.mutate(values)}
        className="flex flex-col gap-4"
      >
        <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm">{t("sectionIdentity")}</legend>
          <FormField name="name" label={tc("fieldName")} className="sm:col-span-2">
            {({ field, id }) => (
              <Input {...field} id={id} placeholder={tc("fieldName")} autoFocus />
            )}
          </FormField>
          <FormField name="displayName" label={tc("fieldDisplayName")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={tc("fieldDisplayName")} />}
          </FormField>
          <FormField name="industry" label={tc("fieldIndustry")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={tc("fieldIndustry")} />}
          </FormField>
          <FormField name="taxId" label={tc("fieldTaxId")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={tc("fieldTaxId")} />}
          </FormField>
          <FormField name="isOrganization" label={tc("fieldIsOrganization")}>
            {({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-label={tc("fieldIsOrganization")}
              />
            )}
          </FormField>
        </fieldset>

        <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm">{t("sectionContact")}</legend>
          <FormField name="email" label={tc("fieldEmail")}>
            {({ field, id }) => (
              <Input {...field} id={id} type="email" placeholder={tc("fieldEmail")} />
            )}
          </FormField>
          <FormField name="phone" label={tc("fieldPhone")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={tc("fieldPhone")} />}
          </FormField>
          <FormField name="mobile" label={tc("fieldMobile")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={tc("fieldMobile")} />}
          </FormField>
          <FormField name="website" label={tc("fieldWebsite")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={tc("fieldWebsite")} />}
          </FormField>
        </fieldset>

        <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm">{t("sectionSettings")}</legend>
          <FormField name="currencyCode" label={tc("fieldCurrency")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={tc("fieldCurrency")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="lang" label={tc("fieldLanguage")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={tc("fieldLanguage")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{tc("languageEnglish")}</SelectItem>
                  <SelectItem value="id">{tc("languageIndonesian")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="active" label={tc("statusActive")} className="sm:col-span-2">
            {({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-label={tc("statusActive")}
              />
            )}
          </FormField>
        </fieldset>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" disabled={createMutation.isPending} asChild>
            <Link href={SUPPLIERS_HREF}>{tCommon("cancel")}</Link>
          </Button>
          <SubmitButton loading={createMutation.isPending} disabled={createMutation.isPending}>
            {t("addSupplier")}
          </SubmitButton>
        </div>
      </Form>
    </div>
  );
}
