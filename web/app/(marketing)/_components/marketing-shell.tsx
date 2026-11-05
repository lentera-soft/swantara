"use client";

import { type ReactNode, useRef } from "react";
import { MarketingFooter } from "./marketing-footer";
import { MarketingHeader } from "./marketing-header";
import { useSwissAnimations } from "./use-swiss-animations";

export type MarketingShellProps = {
  children: ReactNode;
};

export function MarketingShell({ children }: MarketingShellProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  useSwissAnimations(scopeRef);

  return (
    <div
      ref={scopeRef}
      className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground"
    >
      <MarketingHeader />
      <main id="main" className="flex-1 pt-24 sm:pt-28">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
