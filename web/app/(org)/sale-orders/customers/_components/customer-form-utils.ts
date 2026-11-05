import { useTranslations } from "next-intl";
import { z } from "zod";
import type {
  Contact,
  ContactAddress,
  ContactBankAccount,
  CustomerProfile,
} from "@/lib/services/swantara";

export const ADDRESS_TYPES = ["billing", "shipping", "other"] as const;
export const COUNTRY_CODES = ["US", "ID", "SG", "DE", "GB", "JP", "AU"] as const;

export const emptyAddressRow = {
  type: "billing" as (typeof ADDRESS_TYPES)[number],
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  countryCode: "US",
  isDefault: false,
};

export const emptyBankRow = {
  accountHolder: "",
  bankName: "",
  iban: "",
  swiftBic: "",
  accountNumber: "",
  routingNumber: "",
  currencyCode: "",
};

export function stripUrlScheme(value: string): string {
  return value.replace(/^\s*(?:https?:)?\/\//i, "");
}

export function ensureHttpsUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function hasSingleDefaultPerType(addresses: { type: string; isDefault: boolean }[]): boolean {
  const seen = new Set<string>();
  for (const address of addresses) {
    if (!address.isDefault) continue;
    if (seen.has(address.type)) return false;
    seen.add(address.type);
  }
  return true;
}

export function useCustomerFormSchema() {
  const t = useTranslations("Sales");
  const tc = useTranslations("Contacts");
  return z
    .object({
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
      addresses: z.array(
        z.object({
          type: z.enum(ADDRESS_TYPES),
          line1: z.string().trim().min(1, tc("validationAddressLine1Required")),
          line2: z.string().trim(),
          city: z.string().trim(),
          state: z.string().trim(),
          postalCode: z.string().trim(),
          countryCode: z.string(),
          isDefault: z.boolean(),
        }),
      ),
      bankAccounts: z.array(
        z.object({
          accountHolder: z.string().trim().min(1, tc("validationAccountHolderRequired")),
          bankName: z.string().trim(),
          iban: z.string().trim(),
          swiftBic: z.string().trim(),
          accountNumber: z.string().trim(),
          routingNumber: z.string().trim(),
          currencyCode: z.string(),
        }),
      ),
    })
    .refine((values) => hasSingleDefaultPerType(values.addresses), {
      message: t("validationSingleDefaultAddress"),
      path: ["addresses"],
    });
}

export type CustomerFormValues = z.infer<ReturnType<typeof useCustomerFormSchema>>;

export type CustomerFormSeed = {
  contact: Contact;
  addresses: ContactAddress[];
  bankAccounts: ContactBankAccount[];
  profile: CustomerProfile | null;
};

export function buildCustomerFormDefaults(seed?: CustomerFormSeed | null): CustomerFormValues {
  if (!seed) {
    return {
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
      addresses: [],
      bankAccounts: [],
    };
  }

  const { contact, addresses, bankAccounts, profile } = seed;
  return {
    name: contact.name,
    displayName: contact.displayName ?? "",
    isOrganization: contact.isOrganization,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    mobile: contact.mobile ?? "",
    website: stripUrlScheme(contact.website ?? ""),
    taxId: contact.taxId ?? "",
    industry: contact.industry ?? "",
    currencyCode: contact.currencyCode ?? "USD",
    lang: contact.lang || "en",
    active: contact.active,
    customerPaymentTermId: profile?.customerPaymentTermId
      ? String(profile.customerPaymentTermId)
      : "",
    creditLimit: profile?.creditLimit != null ? String(profile.creditLimit) : "",
    receivableAccountId: profile?.receivableAccountId ? String(profile.receivableAccountId) : "",
    addresses: addresses.map((address) => ({
      type: address.type ?? "other",
      line1: address.line1 ?? "",
      line2: address.line2 ?? "",
      city: address.city ?? "",
      state: address.state ?? "",
      postalCode: address.postalCode ?? "",
      countryCode: address.countryCode ?? "US",
      isDefault: address.isDefault,
    })),
    bankAccounts: bankAccounts.map((bank) => ({
      accountHolder: bank.accountHolder ?? "",
      bankName: bank.bankName ?? "",
      iban: bank.iban ?? "",
      swiftBic: bank.swiftBic ?? "",
      accountNumber: bank.accountNumber ?? "",
      routingNumber: bank.routingNumber ?? "",
      currencyCode: bank.currencyCode ?? "",
    })),
  };
}
