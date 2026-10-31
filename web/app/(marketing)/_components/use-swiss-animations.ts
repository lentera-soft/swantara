"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type RefObject, useEffect } from "react";

let scrollTriggerRegistered = false;

function ensureScrollTrigger() {
  if (scrollTriggerRegistered || typeof window === "undefined") {
    return;
  }
  try {
    gsap.registerPlugin(ScrollTrigger);
    scrollTriggerRegistered = true;
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

export function useSwissAnimations(scopeRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = scopeRef.current;
    if (!root || prefersReducedMotion()) {
      return;
    }

    ensureScrollTrigger();

    const ctx = gsap.context(() => {
      // Initial load: hero title lines stagger in
      const heroTitles = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-title"]');
      if (heroTitles.length > 0) {
        gsap.fromTo(
          heroTitles,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.08,
            ease: "power2.out",
            clearProps: "transform,opacity",
          },
        );
      }

      // Initial load: hero meta slides up
      const heroMeta = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-meta"]');
      if (heroMeta.length > 0) {
        gsap.fromTo(
          heroMeta,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            delay: 0.1,
            stagger: 0.06,
            ease: "power2.out",
            clearProps: "transform,opacity",
          },
        );
      }

      // Hero product showcase: load + subtle parallax on scroll
      const heroFrames = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-frame"]');
      if (heroFrames.length > 0) {
        gsap.fromTo(
          heroFrames,
          { y: 48, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            delay: 0.2,
            ease: "power2.out",
            clearProps: "opacity",
          },
        );

        for (const frame of heroFrames) {
          gsap.fromTo(
            frame,
            { y: 40 },
            {
              y: -40,
              ease: "none",
              scrollTrigger: {
                trigger: frame,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            },
          );
        }
      }

      // Bar chart growth on load
      const barElements = gsap.utils.toArray<HTMLElement>('[data-gsap="bar-grow"]');
      if (barElements.length > 0) {
        gsap.fromTo(
          barElements,
          { scaleY: 0, transformOrigin: "bottom center" },
          {
            scaleY: 1,
            duration: 0.7,
            delay: 0.35,
            stagger: 0.05,
            ease: "power2.out",
            clearProps: "transform",
          },
        );
      }

      // Scroll-driven parallax for elements marked with data-gsap="parallax"
      const parallaxEls = gsap.utils.toArray<HTMLElement>('[data-gsap="parallax"]');
      for (const el of parallaxEls) {
        const speed = Number(el.dataset.gsapSpeed ?? "0.12");
        gsap.fromTo(
          el,
          { y: 0 },
          {
            y: () => window.innerHeight * speed * -1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          },
        );
      }

      // Scroll-driven scale reveal for product interface cards
      const scaleReveals = gsap.utils.toArray<HTMLElement>('[data-gsap="scale-reveal"]');
      for (const el of scaleReveals) {
        gsap.fromTo(
          el,
          { y: 48, scale: 0.96, opacity: 0 },
          {
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 82%",
              once: true,
            },
          },
        );
      }

      // Section headers: elegant scroll reveal
      const sectionHeaders = gsap.utils.toArray<HTMLElement>('[data-gsap="section-header"]');
      for (const header of sectionHeaders) {
        gsap.fromTo(
          header,
          { y: 48, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: {
              trigger: header,
              start: "top 84%",
              once: true,
            },
          },
        );
      }

      // Grid stagger groups: refined cascade on scroll
      const staggerGroups = gsap.utils.toArray<HTMLElement>('[data-gsap="grid-stagger"]');
      for (const group of staggerGroups) {
        const items = group.querySelectorAll<HTMLElement>("[data-gsap-item]");
        if (items.length === 0) continue;
        gsap.fromTo(
          items,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: group,
              start: "top 82%",
              once: true,
            },
          },
        );
      }
    }, root);

    return () => {
      ctx.revert();
    };
  }, [scopeRef]);
}
