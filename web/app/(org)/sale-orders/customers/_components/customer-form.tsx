"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { DetailPageSkeleton } from "@/components/detail-page-skeleton";
import { EmailInput } from "@/components/email-input";
import { Form, FormField, SubmitButton } from "@/components/form";
import { FormSection } from "@/components/form-section";
import { Input } from "@/components/input";
import { PageHeader } from "@/components/page-header";
import { PhoneInput } from "@/components/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { Switch } from "@/components/switch";
import { WebsiteInput } from "@/components/website-input";
import {
  useContactAddressesQuery,
  useContactBankAccountsQuery,
  useContactQuery,
  useCustomerProfileQuery,
} from "@/lib/hooks/use-contact-query";
import { useOrgListQuery } from "@/lib/hooks/use-org-query";
import type { Account, PaymentTerm } from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { CustomerAddressLines } from "./customer-address-lines";
import { CustomerBankLines } from "./customer-bank-lines";
import {
  buildCustomerFormDefaults,
  type CustomerFormSeed,
  type CustomerFormValues,
  ensureHttpsUrl,
  stripUrlScheme,
  useCustomerFormSchema,
} from "./customer-form-utils";

const CUSTOMERS_HREF = "/sale-orders/customers";

export function CustomerForm({ orgId, customerId }: { orgId: string; customerId?: string }) {
  const t = useTranslations("Sales");
  const numericCustomerId = Number(customerId);
  const isEdit = Boolean(customerId);
  const validId = Number.isFinite(numericCustomerId) && numericCustomerId > 0;
  const targetCustomerId = validId ? String(numericCustomerId) : "";

  const contactQuery = useContactQuery(orgId, targetCustomerId);
  const addressesQuery = useContactAddressesQuery(orgId, targetCustomerId);
  const bankAccountsQuery = useContactBankAccountsQuery(orgId, targetCustomerId);
  const profileQuery = useCustomerProfileQuery(orgId, targetCustomerId);

  if (isEdit && !validId) {
    return <p className="text-sm text-muted-foreground">{t("customerNotFound")}</p>;
  }

  if (isEdit && contactQuery.isPending) {
    return <DetailPageSkeleton />;
  }

  if (isEdit && !contactQuery.data) {
    return <p className="text-sm text-muted-foreground">{t("customerNotFound")}</p>;
  }

  const seed: CustomerFormSeed | null =
    isEdit && contactQuery.data
      ? {
          contact: contactQuery.data,
          addresses: addressesQuery.data ?? [],
          bankAccounts: bankAccountsQuery.data ?? [],
          profile: profileQuery.data ?? null,
        }
      : null;

  return (
    <CustomerFormFields
      key={`${orgId}:${targetCustomerId || "new"}`}
      orgId={orgId}
      customerId={targetCustomerId}
      seed={seed}
    />
  );
}

function toAddressRequests(values: CustomerFormValues) {
  return values.addresses.map((address) => ({
    type: address.type as "billing" | "shipping" | "other",
    line1: address.line1 || null,
    line2: address.line2 || null,
    city: address.city || null,
    state: address.state || null,
    postalCode: address.postalCode || null,
    countryCode: address.countryCode || null,
    isDefault: address.isDefault,
  }));
}

function toBankRequests(values: CustomerFormValues) {
  return values.bankAccounts.map((bank) => ({
    accountHolder: bank.accountHolder || null,
    bankName: bank.bankName || null,
    iban: bank.iban || null,
    swiftBic: bank.swiftBic || null,
    accountNumber: bank.accountNumber || null,
    routingNumber: bank.routingNumber || null,
    currencyCode: bank.currencyCode || null,
  }));
}

function toCustomerProfile(values: CustomerFormValues) {
  return {
    customerPaymentTermId: values.customerPaymentTermId
      ? Number(values.customerPaymentTermId)
      : null,
    creditLimit: values.creditLimit ? Number(values.creditLimit) : null,
    receivableAccountId: values.receivableAccountId ? Number(values.receivableAccountId) : null,
    active: values.active,
  };
}

function CustomerFormFields({
  orgId,
  customerId,
  seed,
}: {
  orgId: string;
  customerId: string;
  seed: CustomerFormSeed | null;
}) {
  const t = useTranslations("Sales");
  const tc = useTranslations("Contacts");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const schema = useCustomerFormSchema();

  const currenciesQuery = useQuery({
    queryKey: ["currencies"],
    queryFn: () => getSwantaraService().currencies.list(),
  });
  const currencyOptions = currenciesQuery.data?.currencies ?? [];

  const paymentTermsQuery = useOrgListQuery<{ paymentTerms: PaymentTerm[] }, Record<string, never>>(
    "paymentTerms",
    (organizationId) => getSwantaraService().paymentTerms.list(organizationId, { size: 100 }),
  );
  const paymentTerms = paymentTermsQuery.data?.paymentTerms ?? [];

  const accountsQuery = useOrgListQuery<{ accounts: Account[] }, Record<string, never>>(
    "accounts",
    (organizationId) => getSwantaraService().accounts.list(organizationId),
  );
  const receivableAccounts = (accountsQuery.data?.accounts ?? []).filter(
    (account) => account.type === "receivable",
  );

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildCustomerFormDefaults(seed),
  });

  const isEdit = Boolean(customerId);
  const detailHref = `/sale-orders/customers/${customerId}`;

  const saveMutation = useMutation({
    mutationFn: (values: CustomerFormValues) => {
      const numericOrgId = Number(orgId);
      if (isEdit) {
        return getSwantaraService().contacts.update(numericOrgId, Number(customerId), {
          organizationId: numericOrgId,
          name: values.name,
          displayName: values.displayName || null,
          isOrganization: values.isOrganization,
          parentId: seed?.contact.parentId ?? null,
          email: values.email || null,
          phone: values.phone || null,
          mobile: values.mobile || null,
          website: ensureHttpsUrl(values.website),
          taxId: values.taxId || null,
          industry: values.industry || null,
          currencyCode: values.currencyCode || null,
          lang: values.lang || "en",
          active: values.active,
          addresses: toAddressRequests(values),
          bankAccounts: toBankRequests(values),
          customer: toCustomerProfile(values),
        });
      }
      return getSwantaraService().contacts.create(numericOrgId, {
        organizationId: numericOrgId,
        name: values.name,
        displayName: values.displayName || null,
        isOrganization: values.isOrganization,
        parentId: null,
        email: values.email || null,
        phone: values.phone || null,
        mobile: values.mobile || null,
        website: ensureHttpsUrl(values.website),
        taxId: values.taxId || null,
        industry: values.industry || null,
        currencyCode: values.currencyCode || null,
        lang: values.lang || "en",
        active: values.active,
        addresses: toAddressRequests(values),
        bankAccounts: toBankRequests(values),
        customer: toCustomerProfile(values),
        supplier: null,
      });
    },
    onSuccess: () => {
      toast.success(t("customerSaved"));
      router.push(isEdit ? detailHref : CUSTOMERS_HREF);
    },
    onError: () => {
      toast.error(t("saveFailed"));
    },
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        force
        title={isEdit ? t("editCustomerTitle") : t("newCustomer")}
        description={t("newCustomerDescription")}
      />
      <Form
        form={form}
        onSubmit={(values) => saveMutation.mutate(values)}
        className="flex flex-col gap-4"
      >
        <FormSection title={t("sectionIdentity")}>
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
        </FormSection>

        <FormSection title={t("sectionContact")}>
          <FormField name="email" label={t("fieldEmail")}>
            {({ field, id, fieldState }) => (
              <EmailInput
                {...field}
                id={id}
                placeholder={t("fieldEmail")}
                aria-invalid={Boolean(fieldState.error)}
              />
            )}
          </FormField>
          <FormField name="phone" label={t("fieldPhone")}>
            {({ field, id, fieldState }) => (
              <PhoneInput
                id={id}
                defaultCountry="ID"
                autoComplete="tel"
                placeholder={t("fieldPhone")}
                countryAriaLabel={t("fieldPhone")}
                aria-invalid={Boolean(fieldState.error)}
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          </FormField>
          <FormField name="mobile" label={tc("fieldMobile")}>
            {({ field, id, fieldState }) => (
              <PhoneInput
                id={id}
                defaultCountry="ID"
                autoComplete="tel"
                placeholder={tc("fieldMobile")}
                countryAriaLabel={tc("fieldMobile")}
                aria-invalid={Boolean(fieldState.error)}
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          </FormField>
          <FormField name="website" label={tc("fieldWebsite")}>
            {({ field, id, fieldState }) => (
              <WebsiteInput
                {...field}
                id={id}
                placeholder={tc("fieldWebsite")}
                aria-invalid={Boolean(fieldState.error)}
                onChange={(event) => field.onChange(stripUrlScheme(event.target.value))}
              />
            )}
          </FormField>
        </FormSection>

        <FormSection title={tc("addressesTitle")}>
          <div className="sm:col-span-2">
            <CustomerAddressLines form={form} />
          </div>
        </FormSection>

        <FormSection title={tc("bankAccountsTitle")}>
          <div className="sm:col-span-2">
            <CustomerBankLines form={form} />
          </div>
        </FormSection>

        <FormSection title={t("sectionCustomerDefaults")}>
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
        </FormSection>

        <FormSection title={t("sectionSettings")}>
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
        </FormSection>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" disabled={saveMutation.isPending} asChild>
            <Link href={isEdit ? detailHref : CUSTOMERS_HREF}>{tCommon("cancel")}</Link>
          </Button>
          <SubmitButton loading={saveMutation.isPending} disabled={saveMutation.isPending}>
            {isEdit ? tCommon("save") : t("addCustomer")}
          </SubmitButton>
        </div>
      </Form>
    </div>
  );
}
