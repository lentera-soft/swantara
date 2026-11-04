"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function FormSection({
  title,
  description,
  children,
  className,
  defaultOpen = true,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <fieldset className={cn("rounded-lg border p-4", className)}>
      <legend className="px-1">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="flex min-h-8 items-center gap-1.5 text-sm text-foreground"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              !open && "-rotate-90",
            )}
          />
          {title}
        </button>
      </legend>
      <div className={cn("grid gap-4 sm:grid-cols-2", !open && "hidden")}>
        {description ? (
          <p className="col-span-full text-xs text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </div>
    </fieldset>
  );
}
