"use client";

import { GlobeIcon } from "lucide-react";
import { useLocale } from "next-intl";
import type * as React from "react";
import PhoneInputLibrary, { type Country, getCountryCallingCode } from "react-phone-number-input";

import { CountryFlag } from "@/components/country-flag";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/select";

const INTERNATIONAL_COUNTRY = "XX" as unknown as Country;

// Registering the country trigger as a group control reuses the InputGroup focus,
// disabled, and invalid recipes instead of a second border/focus recipe here.
const COUNTRY_SELECT_SLOT = "input-group-control";

type CountryOption = { country: Country; label?: string };

type CountrySelectComponentProps = {
  value?: Country;
  options?: CountryOption[];
  onChange?: (country?: Country) => void;
  onFocus?: React.FocusEventHandler<HTMLElement>;
  onBlur?: React.FocusEventHandler<HTMLElement>;
  disabled?: boolean;
  "aria-label"?: string;
  "data-slot"?: string;
};

function callingCode(country?: Country): string {
  if (!country || country === INTERNATIONAL_COUNTRY) return "";
  try {
    return `+${getCountryCallingCode(country)}`;
  } catch {
    return "";
  }
}

function regionName(option: CountryOption, locale: string): string {
  const fallback = option.label ?? String(option.country);
  if (option.country === INTERNATIONAL_COUNTRY) return fallback;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(option.country) ?? fallback;
  } catch {
    return fallback;
  }
}

function CountryIcon({ country }: { country: Country }) {
  if (country === INTERNATIONAL_COUNTRY) {
    return <GlobeIcon className="text-muted-foreground" />;
  }
  return <CountryFlag code={country} />;
}

function PhoneInputCountrySelect({
  value,
  options = [],
  onChange,
  onFocus,
  onBlur,
  disabled,
  "aria-label": ariaLabel,
  "data-slot": dataSlot,
}: CountrySelectComponentProps) {
  const locale = useLocale();

  return (
    <InputGroupAddon align="inline-start" className="pr-0">
      <Select
        value={value ?? null}
        onValueChange={(next) => onChange?.(next ?? undefined)}
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          aria-label={ariaLabel}
          data-slot={dataSlot}
          onFocus={onFocus}
          onBlur={onBlur}
          className="h-full min-h-0 w-auto rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0"
        >
          {value ? <CountryIcon country={value} /> : null}
          <span className="text-xs">{callingCode(value)}</span>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.country} value={option.country}>
              <span className="flex items-center gap-2">
                <CountryIcon country={option.country} />
                <span>{regionName(option, locale)}</span>
                <span className="text-xs text-muted-foreground">{callingCode(option.country)}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </InputGroupAddon>
  );
}

export type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "type" | "defaultValue" | "ref" | "key"
> & {
  value?: string;
  onChange?: (value: string) => void;
  onCountryChange?: (country?: Country) => void;
  defaultCountry?: Country;
  countries?: Country[];
  countryAriaLabel?: string;
};

export function PhoneInput({
  value,
  onChange,
  onCountryChange,
  defaultCountry = "ID",
  countries,
  countryAriaLabel = "Country code",
  className,
  ...props
}: PhoneInputProps) {
  return (
    <PhoneInputLibrary
      value={value}
      onChange={(next) => onChange?.(next ?? "")}
      onCountryChange={onCountryChange}
      defaultCountry={defaultCountry}
      countries={countries}
      containerComponent={InputGroup}
      containerComponentProps={{ "data-slot": "phone-input" }}
      countrySelectComponent={PhoneInputCountrySelect}
      countrySelectProps={{ "aria-label": countryAriaLabel, "data-slot": COUNTRY_SELECT_SLOT }}
      inputComponent={InputGroupInput}
      className={className}
      {...props}
    />
  );
}
