import type * as React from "react";
import { InputGroup, InputGroupInput, InputGroupText } from "@/components/input-group";
import { InputPrefixAddon } from "@/components/input-prefix-addon";

export type WebsiteInputProps = React.ComponentProps<"input">;

function WebsiteInput({ className, ...props }: WebsiteInputProps) {
  return (
    <InputGroup data-slot="website-input" className={className}>
      <InputPrefixAddon>
        <InputGroupText aria-hidden>https://</InputGroupText>
      </InputPrefixAddon>
      <InputGroupInput
        type="url"
        autoComplete="url"
        inputMode="url"
        placeholder="example.com"
        {...props}
      />
    </InputGroup>
  );
}

export { WebsiteInput };
