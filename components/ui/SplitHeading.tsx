"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, MOTION_QUERIES, SplitText, useGSAP } from "@/lib/gsap";

type Props = {
  as?: ElementType;
  id?: string;
  className?: string;
  children: ReactNode;
  delay?: number;
  start?: string;
};

/**
 * Heading whose lines rise out of masks as it scrolls into view.
 * The split is reverted once the animation completes, leaving clean markup.
 */
export function SplitHeading({ as: Tag = "h2", id, className, children, delay = 0, start = "top 86%" }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        let split: SplitText | null = null;
        let tween: gsap.core.Tween | null = null;
        let cancelled = false;
        gsap.set(el, { autoAlpha: 0 });

        const run = () => {
          if (cancelled) return;
          split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "split-line" });
          gsap.set(el, { autoAlpha: 1 });
          tween = gsap.from(split.lines, {
            yPercent: 112,
            duration: 1.45,
            stagger: 0.085,
            delay,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start, toggleActions: "play none none none" },
            onComplete: () => {
              split?.revert();
              split = null;
            },
          });
        };

        if (document.fonts?.status === "loaded") run();
        else document.fonts?.ready.then(run).catch(run);

        return () => {
          cancelled = true;
          tween?.scrollTrigger?.kill();
          tween?.kill();
          split?.revert();
          gsap.set(el, { clearProps: "opacity,visibility" });
        };
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
