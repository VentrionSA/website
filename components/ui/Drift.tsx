"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";

/**
 * Lets a picture drift gently against the page as it scrolls past (a few per cent of its
 * height, scrubbed), so it reads as a scene with depth rather than a flat print.
 * Still for reduced motion.
 */
export function Drift({ children, className = "", distance = 7, scale = 1.04 }: { children: ReactNode; className?: string; distance?: number; scale?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        gsap.fromTo(
          ref.current,
          { yPercent: distance / 2, scale },
          {
            yPercent: -distance / 2,
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: 0.8 },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
