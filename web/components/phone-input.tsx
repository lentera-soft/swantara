"use client";

import "react-phone-number-input/style.css";

import type * as React from "react";
import PhoneInputLibrary, { type Country } from "react-phone-number-input";

import { InputGroup, InputGroupInput } from "@/components/input-group";
import { cn } from "@/lib/utils";

const COUNTRY_SELECT_SLOT = "phone-input-country";

/**
 * The library owns the country `<select/>` markup (`.PhoneInputCountry`), so the
 * design system control tokens are handed over through its CSS custom properties
 * and scoped descendant utilities instead of a second border/focus recipe.
 */
const controlClasses = cn(
  "group/phone-input",
  "[--PhoneInput-color--focus:var(--color-ring)]",
  "[--PhoneInputCountrySelect-marginRight:0]",
  "[--PhoneInputCountrySelectArrow-color:var(--color-muted-foreground)]",
  "[--PhoneInputCountrySelectArrow-color--focus:var(--color-ring)]",
  "[--PhoneInputCountryFlag-borderColor:var(--color-input)]",
  "[--PhoneInputCountryFlag-borderColor--focus:var(--color-ring)]",
  "[&_.PhoneInputCountry]:h-full",
  "[&_.PhoneInputCountry]:pl-2",
  "[&_.PhoneInputCountry]:pr-1",
  "[&_.PhoneInputCountry]:text-muted-foreground",
  "has-[[data-slot=phone-input-country]:focus-visible]:border-ring",
  "has-[[data-slot=phone-input-country]:focus-visible]:ring-3",
  "has-[[data-slot=phone-input-country]:focus-visible]:ring-ring/50",
);

const inputClasses = cn("h-full", "pl-0 pr-2.5");

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
      inputComponent={InputGroupInput}
      numberInputProps={{ className: inputClasses }}
      countrySelectProps={{ "aria-label": countryAriaLabel, "data-slot": COUNTRY_SELECT_SLOT }}
      className={cn(controlClasses, className)}
      {...props}
    />
  );
}
