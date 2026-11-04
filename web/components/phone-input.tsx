"use client";

import { GlobeIcon } from "lucide-react";
import { useLocale } from "next-intl";
import type * as React from "react";
import { useState } from "react";
import PhoneInputLibrary, {
  type Country,
  getCountries,
  getCountryCallingCode,
} from "react-phone-number-input";

import { CountryFlag } from "@/components/country-flag";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/select";

const INTERNATIONAL_COUNTRY = "XX" as unknown as Country;

// Registering the country trigger as a group control reuses the InputGroup focus,
// disabled, and invalid recipes instead of a second border/focus recipe here.
const COUNTRY_SELECT_SLOT = "input-group-control";

type CountryOption = { value?: Country; label?: string; divider?: boolean };

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

const ALL_COUNTRIES: Country[] = getCountries();

function countryFromValue(value?: string): Country | undefined {
  if (!value?.startsWith("+")) return undefined;
  const prefix = /^\+\d+/.exec(value)?.[0];
  if (!prefix) return undefined;
  return ALL_COUNTRIES.find((country) => callingCode(country) === prefix);
}

// The placeholder keeps mirroring the selected country so its dial prefix
// updates live when the user switches countries in the select.
function phonePlaceholder(country: Country | undefined, placeholder?: string): string | undefined {
  if (!placeholder) return placeholder;
  const separated = /^(\+\d{1,3})([\s\u00A0-]+)(.*)$/.exec(placeholder);
  if (separated) {
    const code = callingCode(country);
    return code ? `${code} ${separated[3]}` : separated[3];
  }
  if (placeholder.startsWith("+")) return placeholder;
  const code = callingCode(country);
  return code ? `${code} ${placeholder}` : placeholder;
}

function regionName(option: CountryOption, locale: string): string {
  const code = String(option.value ?? "");
  const fallback = option.label ?? code;
  if (option.value === INTERNATIONAL_COUNTRY || !/^[A-Z]{2}$/.test(code)) return fallback;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? fallback;
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
        value={value ?? INTERNATIONAL_COUNTRY}
        onValueChange={(next) =>
          onChange?.(
            next && next !== INTERNATIONAL_COUNTRY ? (next as unknown as Country) : undefined,
          )
        }
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          aria-label={ariaLabel}
          data-slot={dataSlot}
          onFocus={onFocus}
          onBlur={onBlur}
          className="h-full min-h-0 w-auto rounded-none border-0 bg-transparent shadow-none ring-0 ring-offset-0 focus-visible:border-0 focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0 data-[size=sm]:rounded-none dark:bg-transparent dark:hover:bg-transparent"
        >
          {value ? <CountryIcon country={value} /> : null}
          <span className="text-xs">{callingCode(value)}</span>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            if (option.divider) return null;
            const value = option.value ?? INTERNATIONAL_COUNTRY;
            return (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  <CountryIcon country={value} />
                  <span>{regionName(option, locale)}</span>
                  <span className="text-xs text-muted-foreground">{callingCode(option.value)}</span>
                </span>
              </SelectItem>
            );
          })}
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
  placeholder,
  ...props
}: PhoneInputProps) {
  const [country, setCountry] = useState<Country | undefined>(
    () => countryFromValue(value) ?? defaultCountry,
  );
  const currentCountry = countryFromValue(value) ?? country;

  function handleCountryChange(next?: Country) {
    setCountry(next);
    onCountryChange?.(next);
  }

  return (
    <PhoneInputLibrary
      value={value}
      onChange={(next) => onChange?.(next ?? "")}
      onCountryChange={handleCountryChange}
      defaultCountry={currentCountry}
      countries={countries}
      placeholder={phonePlaceholder(currentCountry, placeholder)}
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
