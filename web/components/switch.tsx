"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex size-12 shrink-0 items-center justify-center rounded-full outline-none transition-all data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        data-slot="switch-track"
        className="pointer-events-none relative inline-flex items-center rounded-full border border-border transition-all group-focus-visible/switch:border-ring group-focus-visible/switch:ring-3 group-focus-visible/switch:ring-offset-2 group-focus-visible/switch:ring-offset-background group-focus-visible/switch:ring-ring group-aria-invalid/switch:border-destructive group-aria-invalid/switch:ring-3 group-aria-invalid/switch:ring-destructive/20 group-data-[size=default]/switch:h-6 group-data-[size=default]/switch:w-11 group-data-[size=sm]/switch:h-[14px] group-data-[size=sm]/switch:w-[24px] group-data-[checked]/switch:bg-primary group-data-[unchecked]/switch:bg-input dark:group-data-[unchecked]/switch:bg-input/80 dark:group-aria-invalid/switch:border-destructive/50 dark:group-aria-invalid/switch:ring-destructive/40"
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className="pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-4px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-4px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"
        />
      </span>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
