import type * as React from "react";
import { InputGroupAddon } from "@/components/input-group";
import { cn } from "@/lib/utils";

export type InputPrefixAddonProps = React.ComponentProps<"div">;

function InputPrefixAddon({ className, ...props }: InputPrefixAddonProps) {
  return (
    <InputGroupAddon
      className={cn("self-stretch rounded-l-lg border-r border-input bg-muted pr-2", className)}
      {...props}
    />
  );
}

export { InputPrefixAddon };
