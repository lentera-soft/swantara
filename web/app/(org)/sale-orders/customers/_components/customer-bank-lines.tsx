"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/button";
import { FormField } from "@/components/form";
import { Input } from "@/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { getSwantaraService } from "@/lib/services/swantara";
import { type CustomerFormValues, emptyBankRow } from "./customer-form-utils";

export function CustomerBankLines({ form }: { form: UseFormReturn<CustomerFormValues> }) {
  const t = useTranslations("Sales");
  const tc = useTranslations("Contacts");
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bankAccounts",
  });

  const currenciesQuery = useQuery({
    queryKey: ["currencies"],
    queryFn: () => getSwantaraService().currencies.list(),
  });
  const currencyOptions = currenciesQuery.data?.currencies ?? [];

  return (
    <div className="flex flex-col gap-4">
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tc("noBankAccounts")}</p>
      ) : null}
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid gap-4 rounded-md border border-border p-4 sm:grid-cols-2"
        >
          <FormField name={`bankAccounts.${index}.accountHolder`} label={tc("fieldAccountHolder")}>
            {({ field: row, id }) => (
              <Input {...row} id={id} placeholder={tc("fieldAccountHolder")} />
            )}
          </FormField>
          <FormField name={`bankAccounts.${index}.bankName`} label={tc("fieldBankName")}>
            {({ field: row, id }) => <Input {...row} id={id} placeholder={tc("fieldBankName")} />}
          </FormField>
          <FormField name={`bankAccounts.${index}.accountNumber`} label={tc("fieldAccountNumber")}>
            {({ field: row, id }) => (
              <Input {...row} id={id} placeholder={tc("fieldAccountNumber")} />
            )}
          </FormField>
          <FormField name={`bankAccounts.${index}.routingNumber`} label={tc("fieldRoutingNumber")}>
            {({ field: row, id }) => (
              <Input {...row} id={id} placeholder={tc("fieldRoutingNumber")} />
            )}
          </FormField>
          <FormField name={`bankAccounts.${index}.iban`} label={tc("fieldIban")}>
            {({ field: row, id }) => <Input {...row} id={id} placeholder={tc("fieldIban")} />}
          </FormField>
          <FormField name={`bankAccounts.${index}.swiftBic`} label={tc("fieldSwiftBic")}>
            {({ field: row, id }) => <Input {...row} id={id} placeholder={tc("fieldSwiftBic")} />}
          </FormField>
          <FormField name={`bankAccounts.${index}.currencyCode`} label={tc("fieldCurrency")}>
            {({ field: row, id }) => (
              <Select value={row.value} onValueChange={row.onChange}>
                <SelectTrigger id={id} aria-label={tc("fieldCurrency")}>
                  <SelectValue placeholder={tc("fieldCurrency")} />
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
          <div className="flex items-end justify-end sm:col-span-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
              <Trash2 aria-hidden />
              <span>{t("removeLine")}</span>
            </Button>
          </div>
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => append(emptyBankRow)}>
          <Plus aria-hidden />
          <span>{tc("addBankAccount")}</span>
        </Button>
      </div>
    </div>
  );
}
