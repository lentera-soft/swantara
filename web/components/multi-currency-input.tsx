"use client";

import { useCallback, useState } from "react";
import { parseCurrency } from "@/components/currency-field";
import { cn } from "@/lib/utils";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export type MultiCurrencyOption =
  | string
  | {
      code?: string;
      value?: string;
      key?: string;
      id?: string | number;
      label?: React.ReactNode;
      name?: string;
      text?: string;
      symbol?: string | null;
    };

export type MultiCurrencyValue = {
  currency?: string;
  code?: string;
  amount?: number | string | null;
  value?: number | string | null;
  amountValue?: number | string | null;
};

export type MultiCurrencyInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "defaultValue"
> & {
  currencies?: MultiCurrencyOption[];
  currencyOptions?: MultiCurrencyOption[];
  options?: MultiCurrencyOption[];
  currency?: string;
  selectedCurrency?: string;
  defaultCurrency?: string;
  value?: number | string | MultiCurrencyValue | null;
  amount?: number | string | null;
  amountValue?: number | string | null;
  defaultValue?: number | string | MultiCurrencyValue | null;
  onCurrencyChange?: (currency: string) => void;
  onSelectedCurrencyChange?: (currency: string) => void;
  onCurrencySelect?: (currency: string) => void;
  onSelectCurrency?: (currency: string) => void;
  onChangeCurrency?: (currency: string) => void;
  onValueChange?: (value: number | null) => void;
  onAmountChange?: (value: number | null) => void;
  onAmountValueChange?: (value: number | null) => void;
  onChangeAmount?: (value: number | null) => void;
  onChange?:
    | ((value: { currency: string; value: number | null; amount: number | null }) => void)
    | ((currency: string, value: number | null) => void);
  onChangeValue?:
    | ((value: { currency: string; value: number | null; amount: number | null }) => void)
    | ((currency: string, value: number | null) => void);
  onInputChange?:
    | ((value: { currency: string; value: number | null; amount: number | null }) => void)
    | ((currency: string, value: number | null) => void);
  currencyPlaceholder?: string;
  currencyAriaLabel?: string;
  locale?: string;
  className?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionCode(option: MultiCurrencyOption): string {
  if (typeof option === "string") return option;
  const record = option as Record<string, unknown>;
  const code = record.code ?? record.value ?? record.key ?? record.id;
  return code == null ? "" : String(code);
}

function optionLabel(option: MultiCurrencyOption): React.ReactNode {
  if (typeof option === "string") return option;
  const record = option as Record<string, unknown>;
  return (record.label ??
    record.code ??
    record.value ??
    record.name ??
    record.text ??
    "") as React.ReactNode;
}

function extractCurrency(
  value: MultiCurrencyInputProps["value"] | MultiCurrencyInputProps["defaultValue"],
): string | undefined {
  if (isRecord(value)) {
    const record = value as MultiCurrencyValue;
    const currency = record.currency ?? record.code;
    return currency == null ? undefined : String(currency);
  }
  return undefined;
}

function extractAmount(
  value: MultiCurrencyInputProps["value"] | MultiCurrencyInputProps["defaultValue"],
): number | string | null | undefined {
  if (isRecord(value)) {
    const record = value as MultiCurrencyValue;
    return record.amount ?? record.value ?? record.amountValue ?? null;
  }
  if (value === null) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  return undefined;
}

function formatDecimal(value: number, locale?: string) {
  return new Intl.NumberFormat(locale, {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
}

export function MultiCurrencyInput({
  currencies,
  currencyOptions,
  options,
  currency,
  selectedCurrency,
  defaultCurrency,
  value,
  amount,
  amountValue,
  defaultValue,
  onCurrencyChange,
  onSelectedCurrencyChange,
  onCurrencySelect,
  onSelectCurrency,
  onChangeCurrency,
  onValueChange,
  onAmountChange,
  onAmountValueChange,
  onChangeAmount,
  onChange,
  onChangeValue,
  onInputChange,
  currencyPlaceholder,
  currencyAriaLabel = "Currency",
  locale,
  onFocus,
  onBlur,
  className,
  id,
  placeholder,
  disabled,
  "aria-invalid": ariaInvalid,
  ...props
}: MultiCurrencyInputProps) {
  const resolvedOptions = currencies ?? currencyOptions ?? options ?? [];

  const controlledCurrency =
    currency ?? selectedCurrency ?? extractCurrency(value) ?? extractCurrency(defaultValue);

  const controlledAmount =
    amount ??
    amountValue ??
    extractAmount(value) ??
    (extractCurrency(value) === undefined ? extractAmount(defaultValue) : undefined);

  const initialCurrency =
    controlledCurrency ??
    defaultCurrency ??
    (resolvedOptions.length && resolvedOptions[0] ? optionCode(resolvedOptions[0]) : "");

  const initialAmount = controlledAmount ?? extractAmount(defaultValue) ?? null;

  const [internalCurrency, setInternalCurrency] = useState<string>(initialCurrency);
  const [internalAmount, setInternalAmount] = useState<number | string | null>(initialAmount);
  const [editing, setEditing] = useState<string | null>(null);

  const currentCurrency =
    controlledCurrency !== undefined ? String(controlledCurrency) : internalCurrency;
  const currentAmount = controlledAmount !== undefined ? controlledAmount : internalAmount;

  const amountNumber =
    currentAmount == null
      ? null
      : typeof currentAmount === "number"
        ? currentAmount
        : parseCurrency(String(currentAmount));

  const formatEditing = useCallback(
    (raw: number) => (raw === 0 ? "" : formatDecimal(raw, locale)),
    [locale],
  );

  const display =
    editing !== null ? editing : amountNumber == null ? "" : formatDecimal(amountNumber, locale);

  const emitChange = useCallback(
    (nextCurrency: string, nextAmount: number | string | null) => {
      const payload = {
        currency: nextCurrency,
        value: typeof nextAmount === "string" ? parseCurrency(nextAmount) : nextAmount,
        amount: typeof nextAmount === "string" ? parseCurrency(nextAmount) : nextAmount,
      };
      const normalizedAmount = payload.value;
      const combined = onChange ?? onChangeValue ?? onInputChange;
      if (combined) {
        if (combined.length >= 2) {
          (combined as (currency: string, value: number | null) => void)(
            nextCurrency,
            normalizedAmount,
          );
        } else {
          (combined as (value: typeof payload) => void)(payload);
        }
      }
    },
    [onChange, onChangeValue, onInputChange],
  );

  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const formatted = amountNumber == null ? "" : formatEditing(amountNumber);
      setEditing(formatted);
      onFocus?.(event);
    },
    [amountNumber, formatEditing, onFocus],
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setEditing(null);
      onBlur?.(event);
    },
    [onBlur],
  );

  const handleCurrencyChange = useCallback(
    (next: string) => {
      if (controlledCurrency === undefined) setInternalCurrency(next);
      onCurrencyChange?.(next);
      onSelectedCurrencyChange?.(next);
      onCurrencySelect?.(next);
      onSelectCurrency?.(next);
      onChangeCurrency?.(next);
      emitChange(next, currentAmount);
    },
    [
      controlledCurrency,
      currentAmount,
      onCurrencyChange,
      onSelectedCurrencyChange,
      onCurrencySelect,
      onSelectCurrency,
      onChangeCurrency,
      emitChange,
    ],
  );

  const handleAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const cursorPos = input.selectionStart ?? input.value.length;
      const prevLength = input.value.length;

      const raw = parseCurrency(event.target.value);
      const formatted = raw != null ? formatEditing(raw) : "";

      setEditing(formatted);
      if (controlledAmount === undefined) setInternalAmount(raw);
      onValueChange?.(raw);
      onAmountChange?.(raw);
      onAmountValueChange?.(raw);
      onChangeAmount?.(raw);
      emitChange(currentCurrency, raw);

      requestAnimationFrame(() => {
        const diff = formatted.length - prevLength;
        const newCursorPos = Math.max(0, Math.min(cursorPos + diff, formatted.length));
        input.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [
      controlledAmount,
      currentCurrency,
      formatEditing,
      onValueChange,
      onAmountChange,
      onAmountValueChange,
      onChangeAmount,
      emitChange,
    ],
  );

  return (
    <InputGroup data-slot="multi-currency-input" className={cn("group/input-group", className)}>
      <InputGroupAddon align="inline-start" className="pr-0">
        <Select
          value={currentCurrency}
          onValueChange={(next) => {
            if (next != null) handleCurrencyChange(String(next));
          }}
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            aria-label={currencyAriaLabel}
            className="h-full min-h-0 w-auto rounded-none border-0 bg-transparent shadow-none ring-0 ring-offset-0 focus-visible:border-0 focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0 data-[size=sm]:rounded-none dark:bg-transparent dark:hover:bg-transparent"
          >
            <SelectValue placeholder={currencyPlaceholder ?? "Currency"} />
          </SelectTrigger>
          <SelectContent>
            {resolvedOptions.map((option) => {
              const code = optionCode(option);
              return (
                <SelectItem key={code} value={code}>
                  {optionLabel(option)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        data-slot="multi-currency-input"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder ?? "0"}
        value={display}
        aria-invalid={ariaInvalid}
        disabled={disabled}
        onChange={handleAmountChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </InputGroup>
  );
}

export const MultiCurrencyField = MultiCurrencyInput;
export const CurrencyInput = MultiCurrencyInput;
export const CurrencyAmountInput = MultiCurrencyInput;
export const MoneyInput = MultiCurrencyInput;
export const MultiCurrency = MultiCurrencyInput;

export default MultiCurrencyInput;
