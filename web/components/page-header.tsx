"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import React from "react";

import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  force?: boolean;
};

function PageHeaderInner({
  title,
  description,
  actions,
  className,
  force = false,
}: PageHeaderProps) {
  const pathname = usePathname();
  const showsHeading =
    force ||
    pathname === "/" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/");

  if (!showsHeading) {
    return actions ? (
      <div
        data-slot="page-header"
        className={cn("flex flex-wrap items-center justify-end gap-2", className)}
      >
        {actions}
      </div>
    ) : null;
  }

  return (
    <div
      data-slot="page-header"
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}
    >
      <div className="space-y-2">
        <h1 className="font-heading text-3xl leading-tight tracking-tight text-balance">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-base leading-relaxed text-foreground text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export const PageHeader = React.memo(PageHeaderInner);
