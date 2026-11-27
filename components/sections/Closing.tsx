"use client";

import { useRef } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { LogoMark } from "@/components/brand/Logo";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { getCallAction } from "@/lib/site";
import { Portolan } from "./closing/Portolan";

/**
 * Full-bleed closing statement: the relationship stays with Ventrion, wherever the work
 * happens. Behind it, a portolan chart whose routes run in every direction from the star.
 */
export function Closing() {
  const root = useRef<HTMLElement>(null);
  const star = useRef<HTMLSpanElement>(null);
  const call = getCallAction();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        // Upright throughout, exactly as the logo: the star only grows into place.
        gsap.fromTo(
          "[data-closing-star]",
          { scale: 0.7, autoAlpha: 0.4 },
          { scale: 1, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "center center", scrub: 0.8 } },
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
      <Portolan hub={star} />
      {/* the page colour gathers behind the words, so the chart never competes with them */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_44%_42%_at_50%_54%,var(--color-ink)_0%,color-mix(in_srgb,var(--color-ink)_86%,transparent)_42%,transparent_100%)] max-sm:bg-[radial-gradient(ellipse_70%_36%_at_50%_54%,var(--color-ink)_0%,color-mix(in_srgb,var(--color-ink)_86%,transparent)_50%,transparent_100%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-ink to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink to-transparent" />
      <div className="shell relative flex flex-col items-center text-center">
        <span ref={star} data-closing-star className="inline-block text-mark">
          <LogoMark className="h-16 w-auto sm:h-20" />
        </span>
        <SplitHeading id="closing-title" className="display-xl mt-12 max-w-[17ch] text-balance text-ivory">
          Our clients deal with Ventrion.{" "}
          <span className="mt-2 block">
            We bring the world <em className="text-burgundy">to them.</em>
          </span>
        </SplitHeading>
        <Reveal className="mt-12" delay={0.2}>
          <ArrowLink href={call.href} icon="up-right" magnetic>
            {call.label}
          </ArrowLink>
        </Reveal>
      </div>
    </section>
  );
}
