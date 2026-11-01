"use client";

import "react-phone-number-input/style.css";

import type React from "react";
import PhoneInputLibrary from "react-phone-number-input";
import { cn } from "@/lib/utils";

export type PhoneInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountry?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  ariaInvalid?: boolean;
  className?: string;
  countryAriaLabel?: string;
};

export function PhoneInput({
  value,
  onChange,
  defaultCountry = "ID",
  id,
  placeholder,
  disabled,
  ariaInvalid,
  className,
  countryAriaLabel = "Country code",
}: PhoneInputProps) {
  return (
    <PhoneInputLibrary
      value={value}
      onChange={(next) => onChange?.(next ?? "")}
      defaultCountry={defaultCountry as never}
      id={id}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      countrySelectProps={{ "aria-label": countryAriaLabel }}
      className={cn("rounded-lg border border-input px-3", className)}
      style={{ "--PhoneInputCountrySelect-marginRight": "0" } as React.CSSProperties}
    />
  );
}
