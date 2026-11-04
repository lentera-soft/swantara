import type { ComponentType, SVGProps } from "react";
import flags from "react-phone-number-input/flags";

import { cn } from "@/lib/utils";

const FLAG_ICONS = flags as unknown as Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

export type CountryFlagProps = {
  code: string;
  className?: string;
};

export function CountryFlag({ code, className }: CountryFlagProps) {
  const Icon = FLAG_ICONS[code.toUpperCase()];
  if (!Icon) return null;
  return (
    <Icon
      aria-hidden="true"
      className={cn(
        "inline-block h-4 w-6 shrink-0 overflow-hidden rounded-[3px] shadow-xs",
        className,
      )}
    />
  );
}
