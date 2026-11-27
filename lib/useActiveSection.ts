"use client";

import { useEffect, useState } from "react";

/**
 * The section crossing the middle of the screen, out of `ids`; null between them.
 * Used by the navigation to underline the current link and by the phone menu to mark it.
 */
export function useActiveSection(ids: string[], enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    // Only the section crossing the middle of the screen is current; between linked
    // sections (the principles, the closing line) none is.
    const inBand = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) inBand.add(entry.target.id);
          else inBand.delete(entry.target.id);
        });
        setActive(ids.find((id) => inBand.has(id)) ?? null);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids, enabled]);
  return active;
}
