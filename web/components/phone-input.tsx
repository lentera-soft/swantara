"use client";

import { GlobeIcon } from "lucide-react";
import { useLocale } from "next-intl";
import type * as React from "react";
import { memo, useMemo, useState } from "react";
import PhoneInputLibrary, {
  type Country,
  getCountryCallingCode,
  parsePhoneNumber,
} from "react-phone-number-input";

import { CountryFlag } from "@/components/country-flag";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/select";

const INTERNATIONAL_COUNTRY = "XX" as unknown as Country;

// Registering the country trigger as a group control reuses the InputGroup focus,
// disabled, and invalid recipes instead of a second border/focus recipe here.
const COUNTRY_SELECT_SLOT = "input-group-control";
const CONTAINER_PROPS = { "data-slot": "phone-input" };

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

function countryFromValue(value?: string): Country | undefined {
  if (!value?.startsWith("+")) return undefined;
  try {
    return parsePhoneNumber(value)?.country;
  } catch {
    return undefined;
  }
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

// Constructing Intl.DisplayNames is expensive; build one per locale, not one per option.
const displayNamesCache = new Map<string, Intl.DisplayNames | null>();

function regionDisplayNames(locale: string): Intl.DisplayNames | null {
  let names = displayNamesCache.get(locale);
  if (names === undefined) {
    try {
      names = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      names = null;
    }
    displayNamesCache.set(locale, names);
  }
  return names;
}

function regionName(option: CountryOption, names: Intl.DisplayNames | null): string {
  const code = String(option.value ?? "");
  const fallback = option.label ?? code;
  if (!names || option.value === INTERNATIONAL_COUNTRY || !/^[A-Z]{2}$/.test(code)) return fallback;
  try {
    return names.of(code) ?? fallback;
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

const PhoneInputCountrySelect = memo(function PhoneInputCountrySelect({
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

  // The option list (~250 flags + localized names) only depends on the options and
  // locale, so build it once instead of on every keystroke. Passing `items` also lets
  // Select skip walking the children tree to derive them.
  const { items, content } = useMemo(() => {
    const names = regionDisplayNames(locale);
    const entries = options
      .filter((option) => !option.divider)
      .map((option) => ({
        value: option.value ?? INTERNATIONAL_COUNTRY,
        name: regionName(option, names),
        code: callingCode(option.value),
      }));
    return {
      items: entries.map(({ value, name }) => ({ value, label: name })),
      content: entries.map(({ value, name, code }) => (
        <SelectItem key={value} value={value}>
          <span className="flex items-center gap-2">
            <CountryIcon country={value} />
            <span>{name}</span>
            <span className="text-xs text-muted-foreground">{code}</span>
          </span>
        </SelectItem>
      )),
    };
  }, [options, locale]);

  return (
    <InputGroupAddon align="inline-start" className="pr-0">
      <Select
        items={items}
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
        <SelectContent>{content}</SelectContent>
      </Select>
    </InputGroupAddon>
  );
});

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
  const valueCountry = useMemo(() => countryFromValue(value), [value]);
  const currentCountry = valueCountry ?? country;
  const countrySelectProps = useMemo(
    () => ({ "aria-label": countryAriaLabel, "data-slot": COUNTRY_SELECT_SLOT }),
    [countryAriaLabel],
  );

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
      containerComponentProps={CONTAINER_PROPS}
      countrySelectComponent={PhoneInputCountrySelect}
      countrySelectProps={countrySelectProps}
      inputComponent={InputGroupInput}
      className={className}
      {...props}
    />
  );
}
