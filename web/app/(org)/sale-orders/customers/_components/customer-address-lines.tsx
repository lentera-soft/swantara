"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type UseFormReturn, useFieldArray, useFormState } from "react-hook-form";
import { Button } from "@/components/button";
import { FormField } from "@/components/form";
import { Input } from "@/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";
import { Switch } from "@/components/switch";
import {
  ADDRESS_TYPES,
  COUNTRY_CODES,
  type CustomerFormValues,
  emptyAddressRow,
} from "./customer-form-utils";

export function CustomerAddressLines({ form }: { form: UseFormReturn<CustomerFormValues> }) {
  const t = useTranslations("Sales");
  const tc = useTranslations("Contacts");
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "addresses",
  });
  const { errors } = useFormState({ control: form.control, name: "addresses" });
  const addressErrors = errors.addresses;
  const rootMessage =
    (addressErrors && "root" in addressErrors ? addressErrors.root?.message : undefined) ??
    (addressErrors && "message" in addressErrors ? addressErrors.message : undefined);

  return (
    <div className="flex flex-col gap-4">
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tc("noAddresses")}</p>
      ) : null}
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid gap-4 rounded-md border border-border p-4 sm:grid-cols-2"
        >
          <FormField name={`addresses.${index}.type`} label={tc("fieldType")}>
            {({ field: row, id }) => (
              <Select value={row.value} onValueChange={row.onChange}>
                <SelectTrigger id={id} aria-label={tc("fieldType")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADDRESS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {(tc as unknown as (k: string) => string)(`addressType_${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name={`addresses.${index}.countryCode`} label={tc("fieldCountry")}>
            {({ field: row, id }) => (
              <Select value={row.value} onValueChange={row.onChange}>
                <SelectTrigger id={id} aria-label={tc("fieldCountry")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {(tc as unknown as (k: string) => string)(`country_${code}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField name={`addresses.${index}.line1`} label={tc("fieldAddressLine1")}>
            {({ field: row, id }) => (
              <Input {...row} id={id} placeholder={tc("fieldAddressLine1")} />
            )}
          </FormField>
          <FormField name={`addresses.${index}.line2`} label={tc("fieldAddressLine2")}>
            {({ field: row, id }) => (
              <Input {...row} id={id} placeholder={tc("fieldAddressLine2")} />
            )}
          </FormField>
          <FormField name={`addresses.${index}.city`} label={tc("fieldCity")}>
            {({ field: row, id }) => <Input {...row} id={id} placeholder={tc("fieldCity")} />}
          </FormField>
          <FormField name={`addresses.${index}.state`} label={tc("fieldStateRegion")}>
            {({ field: row, id }) => (
              <Input {...row} id={id} placeholder={tc("fieldStateRegion")} />
            )}
          </FormField>
          <FormField name={`addresses.${index}.postalCode`} label={tc("fieldPostalCode")}>
            {({ field: row, id }) => <Input {...row} id={id} placeholder={tc("fieldPostalCode")} />}
          </FormField>
          <FormField name={`addresses.${index}.isDefault`} label={tc("defaultLabel")}>
            {({ field: row }) => (
              <Switch
                checked={row.value}
                onCheckedChange={(checked) => row.onChange(Boolean(checked))}
                aria-label={tc("setAsDefault")}
              />
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
      {rootMessage ? <p className="text-sm text-destructive">{rootMessage}</p> : null}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => append(emptyAddressRow)}>
          <Plus aria-hidden />
          <span>{tc("addAddress")}</span>
        </Button>
      </div>
    </div>
  );
}
