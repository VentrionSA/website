"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrollToId, setLenis } from "@/lib/scroll";

/**
 * Lenis smooth scrolling, synchronised with GSAP ScrollTrigger, plus
 * site-wide handling of in-page anchor links ("/#section" and "#section").
 * Disabled entirely for people who prefer reduced motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;

    if (!reduce) {
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
      setLenis(lenis);
      lenis.on("scroll", ScrollTrigger.update);
      tick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    // Delegated anchor handling so every in-page link scrolls smoothly.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank") return;
      const href = anchor.getAttribute("href") ?? "";
      const match = href.match(/^(?:\/)?#([\w-]+)$/);
      if (!match) return;
      if (window.location.pathname !== "/" && href.startsWith("/")) return; // let Next navigate home first
      if (scrollToId(match[1])) event.preventDefault();
    };
    document.addEventListener("click", onClick);

    // Arriving with a hash (e.g. from /privacy → /#contact): honour it once layout settles.
    const initialHash = window.location.hash.slice(1);
    const hashTimer = initialHash ? window.setTimeout(() => scrollToId(initialHash, { updateHash: false }), 450) : 0;

    // Keep trigger positions accurate once fonts and late assets arrive.
    // Triggers are created per section (some asynchronously), so sort them by
    // page position before recalculating to keep pin spacing correct.
    const refresh = () => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    };
    document.fonts?.ready.then(refresh).catch(() => undefined);
    window.addEventListener("load", refresh);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("load", refresh);
      window.clearTimeout(hashTimer);
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      setLenis(null);
    };
  }, []);

  return <>{children}</>;
}
