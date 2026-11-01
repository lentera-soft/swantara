"use client";

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { type ComponentProps, memo, useEffect, useMemo, useRef } from "react";
import { type DayButton, DayPicker, getDefaultClassNames, type Locale } from "react-day-picker";

import { cn } from "@/lib/utils";

const dayCellClassName =
  "relative flex size-11 items-center justify-center rounded-[var(--calendar-cell-radius)] p-0 tabular-nums outline-none after:pointer-events-none after:absolute after:-inset-1 after:content-['']";

const navButtonClassName =
  "relative inline-flex size-11 cursor-pointer items-center justify-center rounded-[var(--calendar-cell-radius)] text-muted-foreground transition-colors outline-none select-none after:absolute after:-inset-1 after:content-[''] hover:bg-muted hover:text-foreground active:bg-muted focus-visible:border-ring focus-visible:ring-3 ring-offset-2 ring-offset-background focus-visible:ring-ring aria-disabled:pointer-events-none aria-disabled:opacity-40 [&>svg]:size-4";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  locale,
  formatters,
  components,
  ...props
}: ComponentProps<typeof DayPicker>) {
  const defaultClassNames = useMemo(() => getDefaultClassNames(), []);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      className={cn(
        "w-fit [--calendar-cell-radius:var(--radius-md)] p-3",
        "rtl:**:[.rdp-button_previous>svg]:rotate-180",
        "rtl:**:[.rdp-button_next>svg]:rotate-180",
        className,
      )}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex w-fit flex-col gap-6 md:flex-row md:gap-8", defaultClassNames.months),
        month: cn("flex w-fit flex-col gap-1", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between px-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(navButtonClassName, defaultClassNames.button_previous),
        button_next: cn(navButtonClassName, defaultClassNames.button_next),
        month_caption: cn(
          "flex h-11 w-full items-center justify-center px-12",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap text-foreground",
          defaultClassNames.caption_label,
        ),
        dropdowns: cn(
          "flex h-11 w-full items-center justify-center gap-1.5 text-sm",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative inline-flex h-8 items-center rounded-[var(--calendar-cell-radius)] px-2 transition-colors hover:bg-muted focus-within:ring-3 focus-within:ring-ring/50",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "absolute inset-0 cursor-pointer appearance-none bg-transparent opacity-0",
          defaultClassNames.dropdown,
        ),
        month_grid: cn(
          "mt-1 w-full border-separate border-spacing-0",
          defaultClassNames.month_grid,
        ),
        weekdays: cn("flex h-9 items-center", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 text-center text-xs font-medium text-muted-foreground",
          defaultClassNames.weekday,
        ),
        week: cn("flex w-full items-center", defaultClassNames.week),
        week_number_header: cn("w-6 select-none", defaultClassNames.week_number_header),
        week_number: cn(
          "w-6 text-center text-xs text-muted-foreground select-none",
          defaultClassNames.week_number,
        ),
        day: cn(dayCellClassName, defaultClassNames.day),
        range_start: cn(
          "relative isolate rounded-l-[var(--calendar-cell-radius)] rounded-r-none bg-muted",
          defaultClassNames.range_start,
        ),
        range_middle: cn("bg-muted", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate rounded-r-[var(--calendar-cell-radius)] rounded-l-none bg-muted",
          defaultClassNames.range_end,
        ),
        outside: cn("text-muted-foreground opacity-40", defaultClassNames.outside),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                data-slot="calendar-chevron-left"
                className={cn("size-4", className)}
                {...props}
              />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon
                data-slot="calendar-chevron-right"
                className={cn("size-4", className)}
                {...props}
              />
            );
          }
          return (
            <ChevronDownIcon
              data-slot="calendar-chevron-down"
              className={cn("size-4", className)}
              {...props}
            />
          );
        },
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-9 items-center justify-center text-center">{children}</div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

const CalendarDayButton = memo(function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: ComponentProps<typeof DayButton> & {
  locale?: Partial<Locale>;
}) {
  const defaultClassNames = useMemo(() => getDefaultClassNames(), []);

  const ref = useRef<HTMLButtonElement>(null);
  const isFocused = modifiers.focused;
  useEffect(() => {
    if (isFocused) {
      ref.current?.focus({ preventScroll: true });
    }
  }, [isFocused]);

  const isToday = modifiers.today && !modifiers.selected;

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-today={isToday}
      className={cn(
        "relative inline-flex size-11 cursor-pointer items-center justify-center rounded-[var(--calendar-cell-radius)] p-0 text-sm font-normal text-foreground tabular-nums transition-colors outline-none select-none after:absolute after:-inset-1 after:pointer-events-none after:content-['']",
        "hover:bg-muted hover:text-foreground active:bg-muted/80",
        "focus-visible:border-ring focus-visible:ring-3 ring-offset-2 ring-offset-background focus-visible:ring-ring",
        "disabled:cursor-not-allowed aria-disabled:pointer-events-none",
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:font-medium data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:hover:bg-primary/90",
        "data-[range-start=true]:data-[range-end=true]:rounded-[var(--calendar-cell-radius)]",
        "data-[range-start=true]:rounded-l-[var(--calendar-cell-radius)] data-[range-start=true]:rounded-r-none data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-start=true]:hover:bg-primary/90",
        "data-[range-end=true]:rounded-r-[var(--calendar-cell-radius)] data-[range-end=true]:rounded-l-none data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-end=true]:hover:bg-primary/90",
        "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground hover:data-[range-middle=true]:bg-muted",
        "data-[today=true]:bg-muted data-[today=true]:font-semibold data-[today=true]:text-foreground data-[today=true]:hover:bg-muted",
        "data-[today=true]:before:absolute data-[today=true]:before:bottom-0.5 data-[today=true]:before:left-1/2 data-[today=true]:before:size-1 data-[today=true]:before:-translate-x-1/2 data-[today=true]:before:rounded-full data-[today=true]:before:bg-primary data-[today=true]:before:content-['']",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
});

export { Calendar, CalendarDayButton };
