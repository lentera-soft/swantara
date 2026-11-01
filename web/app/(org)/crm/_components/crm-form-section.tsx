"use client";

import { cn } from "@/lib/utils";

export function CrmFormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("grid gap-4 rounded-lg border p-4 sm:grid-cols-2", className)}>
      <legend className="px-1 text-sm font-semibold text-foreground">{title}</legend>
      {description ? (
        <p className="col-span-full text-xs text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </fieldset>
  );
}
