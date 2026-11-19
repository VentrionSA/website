"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";

type Props = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  delay?: number;
  y?: number;
  start?: string;
  /** When set, animates descendants marked with data-reveal in sequence. */
  stagger?: number;
  id?: string;
};

/** Fades and lifts content into place as it enters the viewport. */
export function Reveal({ as: Tag = "div", className, children, delay = 0, y = 36, start = "top 88%", stagger, id }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        const targets = stagger !== undefined ? el.querySelectorAll("[data-reveal]") : [el];
        if (!targets.length) return;
        gsap.from(targets, {
          y,
          autoAlpha: 0,
          duration: 1.35,
          delay,
          stagger: stagger ?? 0,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start, toggleActions: "play none none none" },
        });
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} id={id} className={className}>
      {children}
    </Tag>
  );
}
