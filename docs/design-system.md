# Swantara Web Design System

This document describes the design system, theme architecture, and internationalization (i18n) strategy used in the `@swantara/web` Next.js application. It is intended as a reference for anyone building or extending the UI.

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Tech Stack](#tech-stack)
3. [CSS Architecture](#css-architecture)
4. [Design Tokens](#design-tokens)
5. [Color System](#color-system)
6. [Typography](#typography)
7. [Spacing, Radius & Shadows](#spacing-radius--shadows)
8. [Elevation & Z-Index](#elevation--z-index)
9. [Motion](#motion)
10. [Theme System](#theme-system)
11. [Component Architecture](#component-architecture)
12. [Iconography](#iconography)
13. [Internationalization](#internationalization)
14. [Accessibility](#accessibility)
15. [File Reference](#file-reference)

---

## Design Philosophy

The Swantara web UI follows a **clean, utilitarian, ERP-first** aesthetic:

- **Clarity over decoration.** Interfaces prioritize scannable data, clear hierarchy, and predictable affordances.
- **Consistency over novelty.** Components reuse the same token set, spacing scale, and interaction patterns across every feature.
- **Density-friendly.** The target user spends hours in tables, forms, and ledgers, so surfaces are compact but still touch-accessible (minimum 44×44 px targets).
- **Neutral base + purposeful accent.** The palette is built on warm neutrals with a single blue accent used for primary actions, focus, and selection.
- **Light and dark parity.** Both color schemes are first-class; neither is an afterthought.

These principles are reflected in the [README architecture guidelines](../web/README.md) and enforced by Biome formatting rules and project conventions.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 with CSS-first configuration |
| Animation | `tw-animate-css`, CSS transitions, GSAP (feature-driven) |
| UI Primitives | `@base-ui/react` + `class-variance-authority` |
| Component Scaffolding | shadcn/ui (`base-nova` style, registry alias `@/components`) |
| Icons | Lucide React |
| State (theme) | Zustand |
| i18n | `next-intl` v4 |

---

## CSS Architecture

Styles live in `web/styles/` and are imported through a single entry point.

```
styles/
├── globals.css      # Tailwind entry: imports tokens, themes, base, utilities
├── tokens.css       # Design tokens (colors, spacing, type, motion, elevation)
├── themes.css       # Light & dark variable mappings
├── base.css         # Global reset, base element styles, scrollbar, autofill
└── utilities.css    # Custom Tailwind @utility definitions
```

### Entry Point

`globals.css` bootstraps Tailwind v4, the animation library, and the four style layers:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "./tokens.css";
@import "./themes.css";
@import "./base.css";
@import "./utilities.css";

@source "../app";
@source "../components";
@source "../lib";
```

There is **no `tailwind.config.js`**. Tailwind v4 reads the theme directly from CSS variables using the `@theme inline` block inside `tokens.css`.

---

## Design Tokens

All visual values are stored as CSS custom properties in `tokens.css`. They are grouped into semantic categories and are consumed by Tailwind utilities, component CVA variants, and one-off styles.

### Core Token Categories

- **Primitive colors** — `--black`, `--white`, accent scale (`--accent-50` … `--accent-900`).
- **Semantic colors** — `--color-background`, `--color-surface*`, `--color-foreground*`, `--color-accent*`, `--color-border*`, `--color-danger`, `--color-success`, `--color-warning`, `--color-info`.
- **Spacing** — `--space-0` through `--space-24` based on `--spacing: 0.25rem`.
- **Typography** — size, line-height, weight, and tracking tokens.
- **Border & radius** — width tokens and radius from `none` to `full`.
- **Shadows** — light and dark shadow scales.
- **Motion** — duration and easing tokens, plus precomposed `transition-*` variables.
- **Elevation** — z-index scale from `behind` to `skip`.
- **Sizing** — `--size-touch-min: 48px`, `--size-reading-max: 72ch`.

Tokens are intentionally **unit-agnostic where possible** and use `oklch()` for perceptually uniform color manipulation.

### Tailwind Theme Mapping

Tailwind's theme keys are wired to the token variables in the `@theme inline` block. Examples:

```css
@theme inline {
  --color-background: var(--color-background);
  --color-foreground: var(--color-foreground);
  --color-primary: var(--color-accent);
  --color-primary-foreground: var(--color-accent-on);
  --color-destructive: var(--color-danger);
  --color-border: var(--color-border);
  --color-ring: var(--color-focus-ring);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --radius: var(--radius-md);
  --text-xs: var(--text-xs);
  /* ... */
}
```

This allows standard Tailwind classes such as `bg-background`, `text-foreground`, `border-border`, `rounded-lg`, `shadow-md`, etc.

---

## Color System

### Accent

The brand accent is a single blue family with nine steps:

| Token | Lightness | Chroma | Hue |
|-------|-----------|--------|-----|
| `--accent-50` | 0.97 | 0.02 | 258 |
| `--accent-500` | 0.57 | 0.22 | 258 |
| `--accent-900` | 0.32 | 0.12 | 258 |

- **Light mode primary:** `--accent-600`
- **Dark mode primary:** `--accent-500` (adjusted for perceived brightness)

### Semantic Palettes

Each functional color (success, warning, danger, info) exposes a consistent set of tokens:

- `--color-{name}` — base fill
- `--color-{name}-hover` — hover fill
- `--color-{name}-subtle` — tinted background
- `--color-{name}-border` — tinted border
- `--color-{name}-text` — text on default surface
- `--color-{name}-on` — text on top of the base fill

### Surface Hierarchy

| Token | Purpose |
|-------|---------|
| `--color-background` | Page background |
| `--color-surface` | Cards, panels |
| `--color-surface-raised` | Elevated cards, dropdowns |
| `--color-surface-overlay` | Popovers, modals |
| `--color-surface-sunken` | Canvas, inset areas |
| `--color-surface-warm` | Subtle warm tint for sidebars/canvas |

### Foreground Hierarchy

| Token | Purpose |
|-------|---------|
| `--color-foreground` | Primary text |
| `--color-foreground-secondary` | Secondary/muted text |
| `--color-foreground-tertiary` | Placeholders, disabled hints |
| `--color-foreground-disabled` | Disabled text |
| `--color-foreground-inverse` | Text on dark surfaces |

### Border Hierarchy

| Token | Purpose |
|-------|---------|
| `--color-border` | Default borders |
| `--color-border-subtle` | Dividers, very light separators |
| `--color-border-hover` | Hovered borders |
| `--color-border-active` | Focused/active borders |
| `--color-border-disabled` | Disabled borders |
| `--color-divider` | Section dividers |

---

## Typography

### Font Family

The application uses **Inter Tight** as the sans/heading typeface, loaded via `next/font/google`.

```ts
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
```

Monospace is provided by a system stack (`--font-mono`) for code and tabular data.

### Type Scale

| Token | Size | Typical Use |
|-------|------|-------------|
| `--text-xs` | 0.75rem | Captions, badges |
| `--text-sm` | 0.875rem | Body small, labels |
| `--text-base` | 1rem | Default body |
| `--text-lg` | 1.125rem | Lead paragraphs |
| `--text-xl` | 1.3125rem | Sub-headings |
| `--text-2xl` | 1.625rem | Page titles (mobile) |
| `--text-3xl` | 2rem | Page titles |
| `--text-4xl` | 2.5rem | Hero headings |
| `--text-5xl` | 3.25rem | Large hero |
| `--text-6xl`+ | 4rem+ | Display/marketing |

### Custom Text Utilities

`utilities.css` adds opinionated text styles for marketing and display copy:

- `text-headline` — clamped large headline, tight leading
- `text-display` — maximum display size
- `text-body-lg` / `text-body` — editorial reading widths
- `text-label` — small uppercase-style labels

### Dynamic Root Font Size

The base font size is `16px` by default and scales to `17px` on viewports `≥1024px` for improved desktop readability:

```css
@media (min-width: 1024px) {
  html { font-size: 17px; }
}
```

---

## Spacing, Radius & Shadows

### Spacing

Spacing tokens derive from `--spacing: 0.25rem` and map directly to Tailwind spacing utilities:

```css
--space-1: 0.25rem;   /* p-1 */
--space-2: 0.5rem;    /* p-2 */
--space-4: 1rem;      /* p-4 */
--space-8: 2rem;      /* p-8 */
```

### Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | 0.25rem |
| `--radius-md` | 0.375rem |
| `--radius-lg` | 0.5rem |
| `--radius-xl` | 0.75rem |
| `--radius-2xl` | 1rem |
| `--radius-3xl` | 1.5rem |
| `--radius-full` | 9999px |

Default component radius is `--radius-md` (`0.375rem`). Buttons use `rounded-lg` for a slightly friendlier feel.

### Shadows

Two shadow scales are defined: default (light) and dark (`--shadow-dark-*`). Dark mode automatically swaps to the dark shadow scale in `tokens.css` so elevations remain visible on dark surfaces.

---

## Elevation & Z-Index

A named z-index scale prevents magic numbers:

| Token | Value | Usage |
|-------|-------|-------|
| `--z-behind` | -1 | Backdrop layers |
| `--z-base` | 0 | Default stacking |
| `--z-raised` | 10 | Floating elements |
| `--z-header` | 20 | App header |
| `--z-docked` | 30 | Docked panels |
| `--z-popover` | 40 | Popovers |
| `--z-modal` | 50 | Modals |
| `--z-popover-modal` | 55 | Popovers inside modals |
| `--z-toast` | 60 | Toast notifications |
| `--z-tour` | 70 | Onboarding tour |
| `--z-skip` | 80 | Skip-to-main link |

Custom Tailwind utilities (`z-header`, `z-modal`, etc.) expose these values.

---

## Motion

### Duration Tokens

| Token | Value |
|-------|-------|
| `--duration-instant` | 0ms |
| `--duration-fast` | 120ms |
| `--duration-normal` | 180ms |
| `--duration-slow` | 250ms |

### Easing Tokens

| Token | Curve |
|-------|-------|
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` |

### Precomposed Transitions

- `--transition-colors`
- `--transition-opacity`
- `--transition-transform`
- `--transition-all`

### Reduced Motion

All motion durations and transitions are zeroed when the user prefers reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    /* ... */
  }
}
```

---

## Theme System

### Modes

The application supports three theme choices:

- `light`
- `dark`
- `system` (follows `prefers-color-scheme`)

The resolved value is always either `light` or `dark`.

### Theme Tokens

`themes.css` maps shadcn/ui semantic aliases to the underlying Swantara tokens:

```css
:root {
  --bg: var(--color-background);
  --fg: var(--color-foreground);
  --card: var(--color-surface);
  --popover: var(--color-surface-overlay);
  --primary: var(--color-accent);
  --primary-fg: var(--color-accent-on);
  --secondary: oklch(0.22 0.01 80 / 0.05);
  --muted: oklch(0.22 0.01 80 / 0.05);
  --border: var(--color-border);
  --ring: var(--color-focus-ring);
  /* ... */
}
```

The `.dark` block overrides these aliases with dark-mode values. This separation lets components use `bg-primary`, `text-muted-foreground`, and other shadcn-compatible utility classes while the actual values are controlled by Swantara's own token system.

### Theme State Management

A Zustand store in `stores/theme.store.ts` owns the active theme:

```ts
type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeStore = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  hydrateTheme: () => void;
};
```

- `theme` is persisted to `localStorage` under the key `"theme"`.
- `resolvedTheme` is computed from `theme`, using `window.matchMedia` for `"system"`.
- `applyTheme` adds the resolved class to `<html>` and sets `color-scheme`.
- `listenToSystemTheme` re-resolves the theme when the system preference changes while `"system"` is selected.

### Avoiding Flash of Unstyled Theme

A small inline script in `app/_components/theme-script.tsx` runs `beforeInteractive` and mirrors the store logic. It reads `localStorage`, resolves `"system"`, and applies the class to `<html>` before React hydrates, preventing a light-mode flash when the user has selected dark.

```tsx
<Script id="theme-init" strategy="beforeInteractive">
  {themeScript}
</Script>
```

### Theme Provider

`providers/theme.tsx` hydrates the Zustand store on mount and attaches the system-preference listener:

```tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hydrateTheme = useThemeStore((s) => s.hydrateTheme);

  useEffect(() => { hydrateTheme(); }, [hydrateTheme]);
  useEffect(() => listenToSystemTheme(), []);

  return <>{children}</>;
}
```

### Theme Toggle

Users can toggle themes with:

- The `toggleTheme()` action from the theme store.
- A global keyboard shortcut: `Cmd/Ctrl + Shift + T` (`components/theme-hotkey.tsx`).

### Default Theme

The default resolved theme when no value is stored is **dark**.

---

## Component Architecture

### Primitive Strategy

Components are built on **Base UI** primitives (`@base-ui/react`) rather than Radix UI. Base UI provides accessible, unstyled behavior; Tailwind and the token system provide the visual layer.

Example primitive: `components/input.tsx`

```tsx
import { Input as InputPrimitive } from "@base-ui/react/input";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none ...",
        className,
      )}
      {...props}
    />
  );
}
```

### shadcn/ui Style: `base-nova`

The project uses the `base-nova` shadcn/ui style. Key characteristics:

- Larger, more accessible touch targets (default button/input height is `44px`/`h-11`).
- Subtle borders and muted backgrounds.
- Focus rings use `ring-3` with `ring-ring/50`.
- Components support `data-slot` attributes for styling hooks and debugging.

### Component Registry Alias

`components.json` maps the shadcn/ui `ui` alias to `@/components`, so primitives live directly in `components/` rather than `components/ui/`:

```json
{
  "aliases": {
    "components": "@/components",
    "ui": "@/components"
  }
}
```

### Variants with CVA

Components expose variants through `class-variance-authority`. Example from `components/button.tsx`:

```ts
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "border-border bg-background hover:bg-muted ...",
        secondary: "bg-secondary text-secondary-foreground ...",
        ghost: "hover:bg-muted ...",
        destructive: "bg-destructive/10 text-destructive ...",
        /* ... */
      },
      size: {
        default: "h-11 gap-1.5 px-3 ...",
        sm: "h-11 ...",
        lg: "h-12 ...",
        icon: "size-11",
      },
      shape: {
        default: "",
        pill: "!rounded-full",
      },
    },
  },
);
```

### `data-slot` Convention

Every UI component root element receives a `data-slot` attribute in kebab-case matching the component name:

```tsx
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("...", className)} {...props} />;
}
```

This supports:

- Parent selectors such as `in-data-[slot=button-group]:rounded-lg`.
- Easier debugging in browser DevTools.
- Consistent e2e test selectors.

### Naming & Export Conventions

- **Named exports only**, except for Next.js route boundaries (`page.tsx`, `layout.tsx`, etc.).
- Components use **function declarations**, not arrow functions.
- Props are typed with `type`, not `interface`.
- File names are kebab-case.

See the [web README conventions](../web/README.md#conventions) for full detail.

---

## Iconography

All icons come from **Lucide React** (`lucide-react`). The project does not include custom icon sets. Icons are sized with `size-4` (16px) for inline text, `size-6` (24px) for empty states, and `size-12` (48px) for large illustrations.

Usage pattern:

```tsx
import { InboxIcon } from "lucide-react";

<Icon className="size-6" aria-hidden />
```

Icons are consistently hidden from assistive technologies unless they are standalone controls.

---

## Internationalization

### Overview

The application is internationalized with `next-intl` and currently supports:

| Locale | Code | Default |
|--------|------|---------|
| Bahasa Indonesia | `id` | Yes |
| English | `en` | No |

Default locale is `id`.

### Configuration

Configuration lives in `lib/i18n/config.ts`:

```ts
export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "id";
export const localeCookieName = "NEXT_LOCALE";

export const localeNames: Record<Locale, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};
```

### Message Files

Translations are stored in JSON files at the repository root of `web/messages/`:

```
messages/
├── en.json
└── id.json
```

Messages are organized by **namespace**:

- `Metadata` — page metadata (title, description).
- `Common` — shared UI copy (save, cancel, loading, error messages).
- `Auth` — authentication flows.
- `Nav` — navigation labels.
- `NavModules` — module category labels.
- `Onboarding` — company setup flow.
- `Locale` — language selector labels.
- `Apps`, `Marketing`, `CRM`, `Sales`, etc. — feature namespaces.

### Server-Side Locale Resolution

`i18n/request.ts` resolves the locale per request:

1. Reads the `NEXT_LOCALE` cookie.
2. Falls back to `defaultLocale` if the cookie is missing or invalid.
3. Returns the locale, time zone (`Asia/Jakarta`), messages, and fallback behavior.

```ts
export default getRequestConfig(async () => {
  const store = await cookies();
  const raw = store.get(localeCookieName)?.value;
  const locale = isValidLocale(raw) ? raw : defaultLocale;

  return {
    locale,
    timeZone: "Asia/Jakarta",
    messages: allMessages[locale],
    /* ... */
  };
});
```

### Client Messages

To avoid sending the entire message catalog to the client, `lib/i18n/client-messages.ts` filters messages by namespace:

```ts
export type MessageNamespace = keyof typeof enMessages;

export async function getClientMessages(
  namespaces: readonly MessageNamespace[],
): Promise<AbstractIntlMessages>;
```

The root layout hydrates `NextIntlClientProvider` with only the requested namespaces (typically `["Common"]` globally; feature pages pass additional namespaces).

### Locale Switching

`components/locale-switcher.tsx` renders a globe icon that opens a dropdown of available locales. Selecting a locale calls the server action `setAppLocale` from `lib/i18n/actions.ts`, which sets the `NEXT_LOCALE` cookie, then refreshes the router.

```ts
"use server";

export async function setAppLocale(locale: Locale) {
  const value = isValidLocale(locale) ? locale : defaultLocale;
  const store = await cookies();
  store.set(localeCookieName, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
```

### Translation Usage

Components use `useTranslations` from `next-intl`:

```tsx
const t = useTranslations("sales");
return <p>{t("title")}</p>;
```

Server components use `getTranslations`:

```tsx
const t = await getTranslations("Marketing.meta");
return {
  title: t("homeTitle"),
  description: t("homeDescription"),
};
```

### No Hardcoded English

The project enforces that **all user-visible strings** are translated. This includes:

- Component labels and headings
- Badge content
- `aria-label` / `aria-describedby` values
- Toast messages
- Default prop values
- Status label functions

The only allowed fallback is `humanizeKey` from `@/lib/utils/case`, used only for dynamic enum-like values that do not yet have a translation key.

### Locale-Aware Formatters

`lib/utils/formatters.ts` provides locale-aware formatting utilities:

| Function | Purpose |
|----------|---------|
| `formatNumber` | Decimal formatting |
| `formatDate` | Medium date style |
| `formatDateTime` | Medium date + short time |
| `formatMoney` | Currency or decimal amount |
| `formatBytes` | Binary file sizes |
| `formatDuration` | Milliseconds to `ms`/`s` |
| `formatHours` | Hours with one decimal |
| `getLocalDateString` | Timezone-safe `YYYY-MM-DD` |

Default locale for formatters is `id-ID`, but callers can pass an explicit `locale` option.

### Metadata & SEO

Every page exports locale-aware `generateMetadata`. Public pages include `openGraph`, `alternates` for `en`/`id`, and `robots`. Auth and org pages set `robots: noindex`. The root layout sets `html lang={locale}` for screen readers and search engines.

---

## Accessibility

Accessibility is built into the design system rather than layered on top:

- **Minimum touch target:** 44×44 px (enforced by `min-h-[44px] min-w-[44px]` or equivalent padding).
- **Focus indicators:** Visible `outline` with `--focus-ring-width` and accent color.
- **Skip link:** `components/skip-to-main.tsx` allows keyboard users to jump to `<main id="main">`.
- **Reduced motion:** Motion tokens are disabled when `prefers-reduced-motion: reduce`.
- **Forced colors:** Focus outlines adapt to `Highlight` and disabled elements use `GrayText` in Windows High Contrast mode.
- **Autocomplete styling:** WebKit autofill colors are overridden to match the theme.
- **ARIA:** Base UI primitives provide correct roles, states, and keyboard behavior. Components add `aria-label`, `aria-describedby`, and `aria-invalid` where appropriate.

---

## File Reference

| File | Purpose |
|------|---------|
| `web/styles/globals.css` | Tailwind v4 entry and layer imports |
| `web/styles/tokens.css` | Design tokens and `@theme inline` mapping |
| `web/styles/themes.css` | Light/dark semantic aliases |
| `web/styles/base.css` | Global reset, base styles, scrollbar, autofill |
| `web/styles/utilities.css` | Custom Tailwind utilities |
| `web/components/theme.ts` | Theme type guard and allowed values |
| `web/stores/theme.store.ts` | Zustand theme store + persistence |
| `web/providers/theme.tsx` | Theme provider + system listener |
| `web/app/_components/theme-script.tsx` | Inline script to avoid FOUC |
| `web/components/theme-hotkey.tsx` | `Cmd/Ctrl+Shift+T` toggle |
| `web/components/button.tsx` | Button primitive + CVA variants |
| `web/components/input.tsx` | Input primitive |
| `web/components/label.tsx` | Label primitive |
| `web/components/empty-state.tsx` | Empty-state pattern |
| `web/components/error-state.tsx` | Error-state pattern |
| `web/components/page-header.tsx` | Page header composition |
| `web/components/locale-switcher.tsx` | Language selector |
| `web/lib/i18n/config.ts` | Locale constants and validation |
| `web/lib/i18n/request.ts` | next-intl request config |
| `web/lib/i18n/actions.ts` | `setAppLocale` server action |
| `web/lib/i18n/client-messages.ts` | Namespace message filtering |
| `web/lib/utils/formatters.ts` | Locale-aware formatters |
| `web/messages/en.json` | English translations |
| `web/messages/id.json` | Indonesian translations |
| `web/app/layout.tsx` | Root layout, font, metadata, providers |
| `web/components.json` | shadcn/ui configuration |
| `web/biome.json` | Formatter/linter configuration |

---

## Summary

The Swantara web design system is a **token-driven, CSS-first, accessibility-conscious** foundation built on Tailwind CSS v4, Base UI, and shadcn/ui's `base-nova` style. It separates semantic intent (background, foreground, border, accent) from concrete values, enabling a robust light/dark theme system and consistent component styling across the entire ERP surface. Internationalization is first-class through `next-intl`, with Indonesian as the default locale, namespace-scoped messages, and strict conventions against hardcoded English copy.
