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
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Account, PaymentTerm } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";

const CUSTOMERS_HREF = "/sale-orders/customers";

function useCustomerFormSchema() {
  const t = useTranslations("Sales");
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
    customerPaymentTermId: z.string(),
    creditLimit: z.string(),
    receivableAccountId: z.string(),
  });
}

export function CustomerForm({ orgId }: { orgId: string }) {
  const t = useTranslations("Sales");
  const tc = useTranslations("Contacts");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const schema = useCustomerFormSchema();
  type Values = z.infer<typeof schema>;

  const currenciesQuery = useQuery({
    queryKey: ["currencies"],
    queryFn: () => getSwantaraService().currencies.list(),
  });
  const currencyOptions = currenciesQuery.data?.currencies ?? [];

  const paymentTermsQuery = useOrgListQuery<{ paymentTerms: PaymentTerm[] }, Record<string, never>>(
    "paymentTerms",
    (orgId) => getSwantaraService().paymentTerms.list(orgId, { size: 100 }),
  );
  const paymentTerms = paymentTermsQuery.data?.paymentTerms ?? [];

  const accountsQuery = useOrgListQuery<{ accounts: Account[] }, Record<string, never>>(
    "accounts",
    (organizationId) => getSwantaraService().accounts.list(organizationId),
  );
  const receivableAccounts = (accountsQuery.data?.accounts ?? []).filter(
    (account) => account.type === "receivable",
  );

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
      customerPaymentTermId: "",
      creditLimit: "",
      receivableAccountId: "",
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
        customer: {
          customerPaymentTermId: values.customerPaymentTermId
            ? Number(values.customerPaymentTermId)
            : null,
          creditLimit: values.creditLimit ? Number(values.creditLimit) : null,
          receivableAccountId: values.receivableAccountId
            ? Number(values.receivableAccountId)
            : null,
          active: values.active,
        },
        supplier: null,
      }),
    onSuccess: () => {
      toast.success(t("customerSaved"));
      router.push(CUSTOMERS_HREF);
    },
    onError: () => {
      toast.error(t("saveFailed"));
    },
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader force title={t("newCustomer")} description={t("newCustomerDescription")} />
      <Form
        form={form}
        onSubmit={(values) => createMutation.mutate(values)}
        className="flex flex-col gap-4"
      >
        <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm">{t("sectionIdentity")}</legend>
          <FormField name="name" label={`${t("fieldName")} *`} className="sm:col-span-2">
            {({ field, id }) => (
              <Input
                {...field}
                id={id}
                placeholder={t("fieldName")}
                autoComplete="organization"
                autoFocus
                required
                aria-required="true"
              />
            )}
          </FormField>
          <FormField name="displayName" label={t("fieldDisplayName")}>
            {({ field, id }) => <Input {...field} id={id} placeholder={t("fieldDisplayName")} />}
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
          <FormField name="email" label={t("fieldEmail")}>
            {({ field, id }) => (
              <Input
                {...field}
                id={id}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t("fieldEmail")}
              />
            )}
          </FormField>
          <FormField name="phone" label={t("fieldPhone")}>
            {({ field, id }) => (
              <Input {...field} id={id} type="tel" inputMode="tel" placeholder={t("fieldPhone")} />
            )}
          </FormField>
          <FormField name="mobile" label={tc("fieldMobile")}>
            {({ field, id }) => (
              <Input
                {...field}
                id={id}
                type="tel"
                inputMode="tel"
                placeholder={tc("fieldMobile")}
              />
            )}
          </FormField>
          <FormField name="website" label={tc("fieldWebsite")}>
            {({ field, id }) => (
              <Input
                {...field}
                id={id}
                type="url"
                inputMode="url"
                placeholder={tc("fieldWebsite")}
              />
            )}
          </FormField>
        </fieldset>

        <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm">{t("sectionCustomerDefaults")}</legend>
          <FormField name="customerPaymentTermId" label={t("fieldPaymentTerm")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("fieldPaymentTerm")}>
                  <SelectValue placeholder={t("selectPaymentTerm")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("noPaymentTerm")}</SelectItem>
                  {paymentTerms.map((term) => (
                    <SelectItem key={term.id} value={String(term.id)}>
                      {term.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="receivableAccountId" label={t("fieldReceivableAccount")}>
            {({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={t("fieldReceivableAccount")}>
                  <SelectValue placeholder={t("noReceivableAccount")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("noReceivableAccount")}</SelectItem>
                  {receivableAccounts.map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.code} {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name="creditLimit" label={tc("fieldCreditLimit")}>
            {({ field, id }) => (
              <Input
                {...field}
                id={id}
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                placeholder={tc("fieldCreditLimit")}
              />
            )}
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
          <FormField
            name="active"
            label={t("statusActive")}
            description={t("inactiveCustomerHint")}
            className="sm:col-span-2"
          >
            {({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-label={t("statusActive")}
              />
            )}
          </FormField>
        </fieldset>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" disabled={createMutation.isPending} asChild>
            <Link href={CUSTOMERS_HREF}>{tCommon("cancel")}</Link>
          </Button>
          <SubmitButton loading={createMutation.isPending} disabled={createMutation.isPending}>
            {t("addCustomer")}
          </SubmitButton>
        </div>
      </Form>
    </div>
  );
}
