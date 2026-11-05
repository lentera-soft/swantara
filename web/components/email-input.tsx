import type * as React from "react";
import { InputGroup, InputGroupInput, InputGroupText } from "@/components/input-group";
import { InputPrefixAddon } from "@/components/input-prefix-addon";

export type EmailInputProps = React.ComponentProps<"input">;

function EmailInput({ className, ...props }: EmailInputProps) {
  return (
    <InputGroup data-slot="email-input" className={className}>
      <InputPrefixAddon>
        <InputGroupText aria-hidden>@</InputGroupText>
      </InputPrefixAddon>
      <InputGroupInput type="email" autoComplete="email" inputMode="email" {...props} />
    </InputGroup>
  );
}

export { EmailInput };
