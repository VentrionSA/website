"use client";

import type Lenis from "lenis";

/**
 * Tiny module-level handle on the Lenis instance so any component can request
 * a smooth scroll (or pause scrolling) without prop-drilling or context.
 */
let lenisInstance: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenisInstance = instance;
}

export function getLenis() {
  return lenisInstance;
}

export function stopScroll() {
  lenisInstance?.stop();
  document.documentElement.style.overflow = "hidden";
}

export function startScroll() {
  document.documentElement.style.overflow = "";
  lenisInstance?.start();
}

/** Smoothly scrolls to an element id (with or without "#"), then moves focus there. */
export function scrollToId(id: string, { updateHash = true } = {}) {
  const cleanId = id.replace(/^.*#/, "");
  const target = cleanId === "top" ? document.body : document.getElementById(cleanId);
  if (!target) return false;

  const focusTarget = () => {
    if (target instanceof HTMLElement && target !== document.body) {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  };

  if (lenisInstance) {
    lenisInstance.scrollTo(cleanId === "top" ? 0 : (target as HTMLElement), {
      duration: 1.6,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      onComplete: focusTarget,
    });
  } else {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (cleanId === "top") window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    window.setTimeout(focusTarget, reduce ? 0 : 700);
  }

  if (updateHash) {
    const url = cleanId === "top" ? window.location.pathname : `#${cleanId}`;
    window.history.replaceState(null, "", url);
  }
  return true;
}
