import { cn } from "@/lib/utils";

export type SwissBrandMarkProps = {
  className?: string;
};

export function SwissBrandMark({ className }: SwissBrandMarkProps) {
  return (
    <svg
      data-slot="swiss-brand-mark"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-5 shrink-0", className)}
    >
      <g className="fill-foreground/35">
        <circle cx="12" cy="4.5" r="1.8" />
        <circle cx="19.5" cy="12" r="1.8" />
        <circle cx="12" cy="19.5" r="1.8" />
        <circle cx="4.5" cy="12" r="1.8" />
      </g>
      <circle cx="12" cy="12" r="2.6" className="fill-primary" />
    </svg>
  );
}

export type SwissIndexBadgeProps = {
  index?: string;
  label: string;
  className?: string;
};

export function SwissIndexBadge({ index, label, className }: SwissIndexBadgeProps) {
  return (
    <div
      data-slot="swiss-index-badge"
      className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}
    >
      {index ? (
        <>
          <span className="font-mono text-xs text-primary tabular-nums">{index}</span>
          <span className="text-border" aria-hidden="true">
            /
          </span>
        </>
      ) : null}
      <span className="text-foreground/85">{label}</span>
    </div>
  );
}
