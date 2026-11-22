"use client";

import { useRef } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { LogoMark } from "@/components/brand/Logo";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { BACKDROPS } from "@/lib/backdrops";

/** Full-bleed closing statement: the relationship stays with Ventrion, wherever the work happens. */
export function Closing() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        gsap.fromTo(
          "[data-closing-star]",
          { rotate: -90, scale: 0.7 },
          { rotate: 45, scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "center center", scrub: 0.8 } },
        );
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="closing"
      aria-labelledby="closing-title"
      className="relative isolate flex min-h-[88svh] items-center overflow-clip bg-ink py-[clamp(7rem,14vw,12rem)]"
    >
      <SectionBackdrop src={BACKDROPS.closing} wash={0.55} side="both" saturate={0.55} />
      <div className="shell relative flex flex-col items-center text-center">
        <span data-closing-star className="inline-block text-mark">
          <LogoMark className="h-14 w-auto sm:h-16" />
        </span>
        <SplitHeading id="closing-title" className="display-xl mt-12 max-w-[17ch] text-balance text-ivory">
          Our clients deal with Ventrion.{" "}
          <span className="mt-2 block">
            We coordinate the world <em className="text-burgundy">around them.</em>
          </span>
        </SplitHeading>
        <Reveal className="mt-12" delay={0.2}>
          <ArrowLink href="/#contact" magnetic>
            Request an Introduction
          </ArrowLink>
        </Reveal>
      </div>
    </section>
  );
}
