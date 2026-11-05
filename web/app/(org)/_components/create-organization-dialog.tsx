"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/combobox";
import { CountryFlag } from "@/components/country-flag";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { FormField } from "@/components/form";
import { Input } from "@/components/input";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { ME_ORGANIZATIONS_QUERY_KEY } from "@/lib/queries/me";
import { setActiveOrg } from "@/lib/server/active-org-actions";
import { getSwantaraService, SwantaraUnprocessableError } from "@/lib/services/swantara";

function resolveStandardCode(countryCode: string): string {
  return countryCode.toUpperCase() === "ID" ? "PSAK_EMKM" : "IFRS";
}

function useCreateOrganizationSchema() {
  const tOrg = useTranslations("Organization" as unknown as "Common");
  const tx = tOrg as unknown as (key: string) => string;
  return z.object({
    name: z.string().min(1, tx("nameRequired")),
    countryCode: z.string().min(2, tx("countryRequired")),
    currencyCode: z.string().length(3, tx("currencyRequired")),
  });
}

export type CreateOrganizationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateOrganizationDialog({ open, onOpenChange }: CreateOrganizationDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const tOrg = useTranslations("Organization" as unknown as "Common");
  const tx = tOrg as unknown as (key: string) => string;
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const schema = useCreateOrganizationSchema();
  type Values = z.infer<typeof schema>;

  const [countrySearch, setCountrySearch] = useState("");
  const debouncedCountrySearch = useDebouncedValue(countrySearch, 300);

  const countriesQuery = useQuery({
    queryKey: ["countries", debouncedCountrySearch],
    queryFn: () =>
      getSwantaraService().countries.list(
        debouncedCountrySearch
          ? { filter: [`name:like:${debouncedCountrySearch}`], size: 100 }
          : { size: 100 },
      ),
  });

  const currenciesQuery = useQuery({
    queryKey: ["currencies"],
    queryFn: () => getSwantaraService().currencies.list({ size: 100 }),
  });

  const countries = useMemo(() => {
    const items = countriesQuery.data?.countries ?? [];
    return items.map((country) => {
      let name = country.name;
      try {
        name = new Intl.DisplayNames([locale], { type: "region" }).of(country.code) ?? name;
      } catch {
        // Keep the API-provided name when localization is unavailable.
      }
      return { code: country.code, name, currencyCode: country.currencyCode };
    });
  }, [countriesQuery.data, locale]);

  const currencies = useMemo(
    () =>
      (currenciesQuery.data?.currencies ?? []).map((currency) => ({
        code: currency.code,
        name: currency.name,
      })),
    [currenciesQuery.data],
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", countryCode: "", currencyCode: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      getSwantaraService().organizations.quickCreate({
        name: values.name,
        countryCode: values.countryCode,
        standardCode: resolveStandardCode(values.countryCode),
        baseCurrency: values.currencyCode,
      }),
    onSuccess: async ({ organization }) => {
      await setActiveOrg(organization.id);
      void queryClient.invalidateQueries({ queryKey: ME_ORGANIZATIONS_QUERY_KEY });
      form.reset();
      setCountrySearch("");
      onOpenChange(false);
      toast.success(tx("createSuccess"));
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error: unknown) => {
      if (error instanceof SwantaraUnprocessableError) {
        for (const fieldError of error.fieldErrors ?? []) {
          if (fieldError.field === "name") form.setError("name", { message: fieldError.message });
          if (fieldError.field === "country_code")
            form.setError("countryCode", { message: fieldError.message });
          if (fieldError.field === "base_currency" || fieldError.field === "currency_code")
            form.setError("currencyCode", { message: fieldError.message });
        }
        toast.error(error.message);
        return;
      }
      toast.error(tx("createFailed"));
    },
  });

  function handleSubmit(values: Values) {
    mutation.mutate(values);
  }

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={tx("dialogTitle")}
      description={tx("dialogDescription")}
      form={form}
      onSubmit={handleSubmit}
      isPending={mutation.isPending}
      submitLabel={tCommon("save")}
      cancelLabel={tCommon("cancel")}
      className="sm:max-w-lg"
    >
      <FormField name="name" label={tx("nameLabel")}>
        {({ field, id }) => (
          <Input {...field} id={id} placeholder="Acme Inc." autoComplete="organization" />
        )}
      </FormField>
      <FormField name="countryCode" label={tx("countryLabel")}>
        {({ field, id }) => (
          <Combobox
            items={countries.map((country) => country.code)}
            itemToStringLabel={(value) =>
              countries.find((country) => country.code === value)?.name ?? ""
            }
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value ?? "");
              const country = countries.find((item) => item.code === value);
              if (country?.currencyCode) {
                form.setValue("currencyCode", country.currencyCode, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }}
          >
            <ComboboxInput
              id={id}
              aria-label={tx("countryLabel")}
              placeholder={tx("countryPlaceholder")}
              onChange={(event) => setCountrySearch(event.target.value)}
            />
            <ComboboxContent>
              <ComboboxList>
                {(code: string) => {
                  const country = countries.find((item) => item.code === code);
                  if (!country) return null;
                  return (
                    <ComboboxItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <CountryFlag code={country.code} />
                        <span>{country.name}</span>
                        <span className="text-muted-foreground text-xs">{country.code}</span>
                      </span>
                    </ComboboxItem>
                  );
                }}
              </ComboboxList>
              <ComboboxEmpty>{tx("noResults")}</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
        )}
      </FormField>
      <FormField name="currencyCode" label={tx("currencyLabel")}>
        {({ field, id }) => (
          <Combobox
            items={currencies.map((currency) => currency.code)}
            itemToStringLabel={(value) => {
              const currency = currencies.find((item) => item.code === value);
              return currency ? `${currency.code} · ${currency.name}` : "";
            }}
            value={field.value}
            onValueChange={(value) => field.onChange(value ?? "")}
          >
            <ComboboxInput
              id={id}
              aria-label={tx("currencyLabel")}
              placeholder={tx("currencyPlaceholder")}
            />
            <ComboboxContent>
              <ComboboxList>
                {(code: string) => {
                  const currency = currencies.find((item) => item.code === code);
                  if (!currency) return null;
                  return (
                    <ComboboxItem key={currency.code} value={currency.code}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{currency.code}</span>
                        <span>{currency.name}</span>
                      </span>
                    </ComboboxItem>
                  );
                }}
              </ComboboxList>
              <ComboboxEmpty>{tx("noResults")}</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
        )}
      </FormField>
    </EntityFormDialog>
  );
}
