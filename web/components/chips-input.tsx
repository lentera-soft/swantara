"use client";

import { X } from "lucide-react";
import { type ComponentProps, useRef, useState } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { cn } from "@/lib/utils/index";

type ChipsInputProps = Omit<ComponentProps<"div">, "onChange" | "children"> & {
  values: string[];
  onValuesChange: (values: string[]) => void;
  inputId?: string;
  inputAriaLabel?: string;
  placeholder?: string;
  removeLabel: string;
};

function parseRaw(raw: string): string[] {
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function ChipsInput({
  values,
  onValuesChange,
  inputId,
  inputAriaLabel,
  placeholder,
  removeLabel,
  className,
  ...props
}: ChipsInputProps) {
  const [draft, setDraft] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  function commit() {
    const pending = parseRaw(draft);
    setDraft("");
    if (pending.length === 0) return;
    const next = [...values];
    for (const entry of pending) {
      if (!next.some((existing) => existing.toLowerCase() === entry.toLowerCase())) {
        next.push(entry);
      }
    }
    onValuesChange(next);
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: visual grouping wrapper; there is no native element for a non-form group
    // biome-ignore lint/a11y/useKeyWithClickEvents: click-to-focus convenience on an inert wrapper; control focus is reachable via keyboard directly
    <div
      ref={containerRef}
      role="group"
      className={cn(
        "flex min-h-11 flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent bg-clip-padding px-2.5 py-1 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-data-[slot=chip]:px-1 dark:bg-input/30",
        className,
      )}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button")) {
          return;
        }
        containerRef.current?.querySelector("input")?.focus();
      }}
      {...props}
    >
      {values.map((value, index) => (
        <span
          key={value}
          data-slot="chip"
          className="flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1 rounded-sm bg-muted pl-1.5 pr-0 text-xs whitespace-nowrap text-foreground"
        >
          {value}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`${removeLabel} ${value}`}
            className="-ml-1 size-5 rounded-sm p-0 opacity-50 hover:opacity-100"
            onClick={() => onValuesChange(values.filter((_, position) => position !== index))}
          >
            <X className="pointer-events-none size-3" />
          </Button>
        </span>
      ))}
      <Input
        id={inputId}
        value={draft}
        aria-label={inputAriaLabel}
        placeholder={values.length === 0 ? placeholder : ""}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            commit();
          } else if (event.key === "Backspace" && draft === "" && values.length > 0) {
            event.preventDefault();
            onValuesChange(values.slice(0, -1));
          }
        }}
        className="h-9 w-auto min-w-16 flex-1 rounded-none border-0 bg-transparent px-0 text-sm shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent"
      />
    </div>
  );
}
