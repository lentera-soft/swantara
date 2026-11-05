import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { splitTitle } from "./marketing-utils";
import { SwissIndexBadge } from "./swiss-grid-mark";

/**
 * Swiss layout primitives for every public page. Pages compose these instead of hand-placing
 * grids, so the same rules hold everywhere:
 *   - full bleed: edge gutters only, no centred container;
 *   - a 12-column grid; headlines take columns 1–7, supporting copy and actions 9–12;
 *   - hairline rules separate and introduce blocks;
 *   - one eyebrow style (uppercase label, optional blue index).
 */

export const GUTTER = "px-4 sm:px-6 lg:px-8";

/** Two-tone headline: the first line in foreground, the rest muted ("\n" separates lines). */
export function TwoTone({ text }: { text: string }) {
  return splitTitle(text).map((line, idx) => (
    <span key={line} className={cn("block", idx > 0 && "text-muted-foreground")}>
      {line}
    </span>
  ));
}

export function Eyebrow({ index, children }: { index?: string; children: string }) {
  return <SwissIndexBadge index={index} label={children} />;
}

type SectionProps = {
  id?: string;
  tone?: "default" | "warm";
  /** Drop the top rule (e.g. the first section after a hero that already ends in one). */
  flush?: boolean;
  className?: string;
  children: ReactNode;
};

export function Section({ id, tone = "default", flush, className, children }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        !flush && "border-t border-border-subtle",
        tone === "warm" && "bg-surface-warm",
      )}
    >
      <div className={cn(GUTTER, "py-20 lg:py-28", className)}>{children}</div>
    </section>
  );
}

type SectionHeaderProps = {
  index?: string;
  eyebrow: string;
  title: string;
  lead?: string;
  /** Actions or extra copy under the lead (right columns). */
  children?: ReactNode;
  className?: string;
};

export function SectionHeader({
  index,
  eyebrow,
  title,
  lead,
  children,
  className,
}: SectionHeaderProps) {
  const hasAside = Boolean(lead) || Boolean(children);
  return (
    <div className={cn("grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8", className)}>
      <div className="lg:col-span-7">
        <div data-gsap="fade-up">
          <Eyebrow index={index}>{eyebrow}</Eyebrow>
        </div>
        <h2 data-gsap="split-lines" className="mt-4 max-w-4xl text-headline text-foreground">
          <TwoTone text={title} />
        </h2>
      </div>
      {hasAside ? (
        <div
          data-gsap="fade-up"
          data-gsap-delay="0.1"
          className="flex flex-col justify-end gap-6 lg:col-span-4 lg:col-start-9"
        >
          {lead ? <p className="text-lg leading-relaxed text-muted-foreground">{lead}</p> : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}

type CtaLink = { href: string; label: string };

export function CtaPair({ primary, secondary }: { primary: CtaLink; secondary?: CtaLink }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        size="lg"
        shape="pill"
        className="w-full justify-between px-6 sm:w-auto sm:flex-1"
        asChild
      >
        <Link href={primary.href}>
          <span>{primary.label}</span>
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </Button>
      {secondary ? (
        <Button
          size="lg"
          variant="outline"
          shape="pill"
          className="w-full justify-between px-6 sm:w-auto sm:flex-1"
          asChild
        >
          <Link href={secondary.href}>
            <span>{secondary.label}</span>
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

type PageHeroProps = {
  eyebrow: string;
  title: string;
  lead?: string;
  /** Right side of the ruled row under the headline (usually <CtaPair />). */
  actions?: ReactNode;
  /** Optional content below the hero rows (e.g. a search field or filter). */
  children?: ReactNode;
};

/**
 * Sub-page intro, matching the landing intro: a hairline with the eyebrow, a wide display
 * headline, and a ruled row with the lead (columns 1–5) and actions (columns 9–12).
 */
export function PageHero({ eyebrow, title, lead, actions, children }: PageHeroProps) {
  return (
    <section className="overflow-hidden">
      <div className={cn(GUTTER, "pt-8 pb-16 lg:pt-10 lg:pb-24")}>
        <div className="border-t border-border-subtle pt-4">
          <div data-gsap="hero-meta">
            <Eyebrow>{eyebrow}</Eyebrow>
          </div>
        </div>

        <h1
          data-gsap="hero-title"
          className="mt-14 max-w-6xl text-display font-medium text-foreground lg:mt-20"
        >
          <TwoTone text={title} />
        </h1>

        {lead || actions ? (
          <div className="mt-12 grid grid-cols-1 gap-6 border-t border-border-subtle pt-5 lg:mt-16 lg:grid-cols-12 lg:items-end lg:gap-8">
            {lead ? (
              <p
                data-gsap="hero-meta"
                className="max-w-md text-lg leading-relaxed text-muted-foreground lg:col-span-5"
              >
                {lead}
              </p>
            ) : null}
            {actions ? (
              <div data-gsap="hero-meta" className="lg:col-span-4 lg:col-start-9">
                {actions}
              </div>
            ) : null}
          </div>
        ) : null}

        {children ? <div className="mt-12 lg:mt-16">{children}</div> : null}
      </div>
    </section>
  );
}
