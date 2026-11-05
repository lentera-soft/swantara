"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { type RefObject, useEffect, useLayoutEffect } from "react";

/**
 * Swiss motion: flat, on the grid, short, and it settles.
 *
 * One vocabulary for every public page:
 *   - text rises out of line masks;
 *   - blocks fade up a short, fixed distance;
 *   - frames and rules wipe along the grid;
 *   - numbers count once.
 * Everything plays once and comes to rest. Nothing loops, follows the cursor, pins the page
 * or moves in 3D. Elements opt in with `data-gsap` (see docs/design-system.md → Motion).
 */
export const MOTION = {
  ease: "power3.out",
  easeInOut: "power3.inOut",
  duration: 0.8,
  distance: 16,
  stagger: 0.06,
  /** Scroll reveals start when the element's top reaches this point of the viewport. */
  start: "top 85%",
} as const;

/** Intro sequence offsets (s): nav → headline → supporting copy → product frame. */
const INTRO = { nav: 0, title: 0.1, meta: 0.4, frame: 0.55 } as const;

// Layout effect so split/hidden states are applied before first paint (no flash of final state).
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

let pluginsRegistered = false;

function ensurePlugins() {
  if (pluginsRegistered || typeof window === "undefined") {
    return;
  }
  try {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    pluginsRegistered = true;
  } catch {
    // Gracefully ignore in non-browser test environments
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Two-tone headlines render one block <span> per line; split those, else the element itself. */
function lineTargets(el: HTMLElement): HTMLElement[] {
  const children = Array.from(el.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
  return children.length > 0 ? children : [el];
}

/** Masked line split. Mask padding keeps descenders (g, y, p) from being clipped. */
function splitMaskedLines(el: HTMLElement, animate: (lines: Element[]) => gsap.core.Animation) {
  SplitText.create(lineTargets(el), {
    type: "lines",
    mask: "lines",
    tag: "span",
    aria: "none",
    autoSplit: true,
    onSplit: (self) => {
      // tag "span" keeps valid markup inside headings, but spans are inline: force block so the
      // mask clips and the line transform applies.
      gsap.set(self.masks, { display: "block", paddingBottom: "0.14em", marginBottom: "-0.14em" });
      gsap.set(self.lines, { display: "block" });
      return animate(self.lines);
    },
  });
}

const lineRise = { yPercent: 100, duration: 0.9, stagger: 0.08, ease: MOTION.ease };
const fadeUp = { y: MOTION.distance, opacity: 0, duration: MOTION.duration, ease: MOTION.ease };

const PRE_HYDRATION_HIDDEN =
  '[data-gsap="hero-nav"], [data-gsap="hero-title"], [data-gsap="word-cycle"], [data-gsap="hero-meta"], [data-gsap="hero-frame"]';

/** Live headline loop: how long each word holds, and how fast characters roll. */
const WORD_CYCLE = {
  hold: 2.4,
  out: 0.45,
  in: 0.75,
  charStagger: 0.028,
  /** Parked offset for hidden words: clears the mask's descender padding. */
  park: 150,
} as const;

const COUNTER_PATTERN = /^(\D*)(\d+(?:[.,]\d+)?)(.*)$/s;

/** Frame wipe: the panel is uncovered top → bottom along the grid, then its parts settle in. */
function revealFrame(frame: HTMLElement, vars: gsap.TimelineVars) {
  const tl = gsap.timeline(vars);
  tl.fromTo(
    frame,
    { clipPath: "inset(0% 0% 100% 0% round 1rem)", y: MOTION.distance },
    {
      clipPath: "inset(0% 0% 0% 0% round 1rem)",
      y: 0,
      duration: 1.1,
      ease: MOTION.easeInOut,
      clearProps: "clipPath,transform",
    },
  );
  const parts = gsap.utils.toArray<HTMLElement>("[data-gsap-part]", frame);
  if (parts.length > 0) {
    tl.from(
      parts,
      { ...fadeUp, y: 8, stagger: MOTION.stagger, clearProps: "transform,opacity" },
      0.55,
    );
  }
  const bars = gsap.utils.toArray<HTMLElement>('[data-gsap="bar-grow"]', frame);
  if (bars.length > 0) {
    tl.fromTo(
      bars,
      { scaleY: 0, transformOrigin: "bottom center" },
      { scaleY: 1, duration: 0.7, stagger: 0.04, ease: MOTION.ease, clearProps: "transform" },
      0.7,
    );
  }
  return tl;
}

export function useSwissAnimations(scopeRef: RefObject<HTMLElement | null>) {
  useIsomorphicLayoutEffect(() => {
    const root = scopeRef.current;
    if (!root || prefersReducedMotion()) {
      return;
    }

    ensurePlugins();
    const cleanups: Array<() => void> = [];

    const ctx = gsap.context(() => {
      // Intro elements are hidden before hydration (.motion-ok in base.css) so the server render
      // doesn't flash; their from-states are set below, before the browser paints.
      gsap.set(gsap.utils.toArray<HTMLElement>(PRE_HYDRATION_HIDDEN), { visibility: "visible" });

      // ── Intro (on load) ────────────────────────────────────────────────────────────────────
      const heroNav = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-nav"]');
      if (heroNav.length > 0) {
        gsap.from(heroNav, {
          ...fadeUp,
          y: -MOTION.distance,
          delay: INTRO.nav,
          clearProps: "transform,opacity",
        });
      }

      for (const title of gsap.utils.toArray<HTMLElement>('[data-gsap="hero-title"]')) {
        splitMaskedLines(title, (lines) => gsap.from(lines, { ...lineRise, delay: INTRO.title }));
      }

      // Live headline: the last word loops. Characters roll out upward and the next word rolls
      // in through the line mask. This is the one looping element on public pages, and it pauses whenever it is off screen.
      for (const cycle of gsap.utils.toArray<HTMLElement>('[data-gsap="word-cycle"]')) {
        const lines = gsap.utils.toArray<HTMLElement>("[data-word-line]", cycle);
        const words = gsap.utils.toArray<HTMLElement>("[data-word]", cycle);

        const splits = words.map((word) =>
          SplitText.create(word, { type: "chars", tag: "span", aria: "none" }),
        );
        const chars = splits.map((split) => split.chars);
        gsap.set(chars.flat(), { display: "inline-block" });
        gsap.set(words, { visibility: "visible" });
        chars.slice(1).forEach((set) => {
          gsap.set(set, { yPercent: WORD_CYCLE.park });
        });

        // Intro: the fixed lines rise with the rest of the headline, then the first word rolls in
        gsap.from(lines, { ...lineRise, delay: INTRO.title });
        gsap.from(chars[0] ?? [], {
          yPercent: WORD_CYCLE.park,
          duration: WORD_CYCLE.in,
          stagger: WORD_CYCLE.charStagger,
          ease: MOTION.ease,
          delay: INTRO.title + 0.2,
        });

        if (words.length < 2) continue;
        const loop = gsap.timeline({ repeat: -1, delay: INTRO.title + 1 });
        words.forEach((_, index) => {
          const next = (index + 1) % words.length;
          loop
            .to({}, { duration: WORD_CYCLE.hold })
            .to(chars[index] ?? [], {
              yPercent: -WORD_CYCLE.park,
              duration: WORD_CYCLE.out,
              stagger: WORD_CYCLE.charStagger,
              ease: "power3.in",
            })
            .fromTo(
              chars[next] ?? [],
              { yPercent: WORD_CYCLE.park },
              {
                yPercent: 0,
                duration: WORD_CYCLE.in,
                stagger: WORD_CYCLE.charStagger,
                ease: MOTION.ease,
              },
              `-=${WORD_CYCLE.out * 0.4}`,
            );
        });

        ScrollTrigger.create({
          trigger: cycle,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            if (self.isActive) loop.resume();
            else loop.pause();
          },
        });
        cleanups.push(() => {
          for (const split of splits) split.revert();
        });
      }

      const heroMeta = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-meta"]');
      if (heroMeta.length > 0) {
        gsap.from(heroMeta, {
          ...fadeUp,
          delay: INTRO.meta,
          stagger: MOTION.stagger,
          clearProps: "transform,opacity",
        });
      }

      for (const frame of gsap.utils.toArray<HTMLElement>('[data-gsap="hero-frame"]')) {
        revealFrame(frame, { delay: INTRO.frame });
      }

      // ── On scroll (once) ───────────────────────────────────────────────────────────────────
      for (const heading of gsap.utils.toArray<HTMLElement>('[data-gsap="split-lines"]')) {
        splitMaskedLines(heading, (lines) =>
          gsap.from(lines, {
            ...lineRise,
            scrollTrigger: { trigger: heading, start: MOTION.start, once: true },
          }),
        );
      }

      for (const el of gsap.utils.toArray<HTMLElement>(
        '[data-gsap="fade-up"], [data-gsap="section-header"]',
      )) {
        gsap.from(el, {
          ...fadeUp,
          delay: Number(el.dataset.gsapDelay ?? "0"),
          scrollTrigger: { trigger: el, start: MOTION.start, once: true },
        });
      }

      for (const group of gsap.utils.toArray<HTMLElement>('[data-gsap="grid-stagger"]')) {
        const items = group.querySelectorAll<HTMLElement>("[data-gsap-item]");
        if (items.length === 0) continue;
        gsap.from(items, {
          ...fadeUp,
          stagger: MOTION.stagger,
          scrollTrigger: { trigger: group, start: MOTION.start, once: true },
        });
      }

      for (const frame of gsap.utils.toArray<HTMLElement>('[data-gsap="frame"]')) {
        revealFrame(frame, { scrollTrigger: { trigger: frame, start: MOTION.start, once: true } });
      }

      // Rules draw left → right, like a line being ruled on the grid
      for (const rule of gsap.utils.toArray<HTMLElement>('[data-gsap="rule"]')) {
        gsap.fromTo(
          rule,
          { scaleX: 0, transformOrigin: "0% 50%" },
          {
            scaleX: 1,
            duration: 1,
            ease: MOTION.easeInOut,
            clearProps: "transform",
            scrollTrigger: { trigger: rule, start: "top 90%", once: true },
          },
        );
      }

      // Bars outside a frame grow on scroll (bars inside one grow as part of its reveal)
      const looseBars = gsap.utils
        .toArray<HTMLElement>('[data-gsap="bar-grow"]')
        .filter((bar) => !bar.closest('[data-gsap="hero-frame"], [data-gsap="frame"]'));
      if (looseBars.length > 0) {
        gsap.fromTo(
          looseBars,
          { scaleY: 0, transformOrigin: "bottom center" },
          {
            scaleY: 1,
            duration: 0.7,
            stagger: 0.04,
            ease: MOTION.ease,
            clearProps: "transform",
            scrollTrigger: { trigger: looseBars[0], start: MOTION.start, once: true },
          },
        );
      }

      // Count-up numbers. Keeps prefix/suffix and the locale's decimal separator ("Rp4,2 M",
      // "99,99%"). Writes to the existing text node so React keeps ownership of it.
      for (const el of gsap.utils.toArray<HTMLElement>('[data-gsap="counter"]')) {
        const node = el.firstChild;
        if (!(node instanceof Text) || el.childNodes.length !== 1) continue;
        const original = node.nodeValue ?? "";
        const match = original.match(COUNTER_PATTERN);
        if (!match) continue;
        const [, prefix = "", digits = "", suffix = ""] = match;
        const decimals = digits.split(/[.,]/)[1]?.length ?? 0;
        if (decimals === 3) continue; // ambiguous thousands separator ("10.000"): leave static
        const separator = digits.includes(",") ? "," : ".";
        const target = Number(digits.replace(",", "."));
        const format = (value: number) =>
          `${prefix}${value.toFixed(decimals).replace(".", separator)}${suffix}`;
        const state = { value: 0 };
        node.nodeValue = format(0);
        // Counters inside a frame wait for it to open
        const inIntro = el.closest('[data-gsap="hero-frame"]') !== null;
        const frame = el.closest<HTMLElement>('[data-gsap="frame"]');
        gsap.to(state, {
          value: target,
          duration: 1.4,
          ease: MOTION.ease,
          ...(inIntro
            ? { delay: INTRO.frame + 0.6 }
            : {
                delay: frame ? 0.6 : 0,
                scrollTrigger: { trigger: frame ?? el, start: MOTION.start, once: true },
              }),
          onUpdate: () => {
            node.nodeValue = format(state.value);
          },
          onComplete: () => {
            node.nodeValue = original;
          },
        });
        cleanups.push(() => {
          node.nodeValue = original;
        });
      }

      ScrollTrigger.refresh();
    }, root);

    return () => {
      ctx.revert();
      for (const cleanup of cleanups) cleanup();
    };
  }, [scopeRef]);
}
