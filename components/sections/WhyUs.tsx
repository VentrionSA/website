"use client";

import { useRef } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { PILLARS } from "@/lib/content";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { LogoMark } from "@/components/brand/Logo";

export function WhyUs() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        gsap.fromTo(
          "[data-why-mark]",
          { rotate: -30, yPercent: -6 },
          { rotate: 60, yPercent: 10, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.8 } },
        );
        gsap.utils.toArray<HTMLElement>("[data-pillar]").forEach((pillar, i) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: "[data-pillars]", start: "top 78%", once: true } });
          tl.fromTo(pillar.querySelector("[data-pillar-rule]"), { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: "expo.inOut" }, i * 0.12).from(
            pillar.querySelectorAll("[data-pillar-text]"),
            { y: 36, autoAlpha: 0, duration: 1.2, stagger: 0.08, ease: "expo.out" },
            0.2 + i * 0.12,
          );
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="why" aria-labelledby="why-title" className="relative overflow-hidden bg-ink py-[clamp(6rem,13vw,12rem)]">
      <div data-why-mark aria-hidden="true" className="pointer-events-none absolute -right-[12vw] top-[6%] text-ivory/[0.035]">
        <LogoMark className="h-[62vw] w-auto max-h-[900px] lg:h-[46vw]" />
      </div>

      <div className="shell relative">
        <Eyebrow index="06">Why Work With Us</Eyebrow>
        <SplitHeading id="why-title" className="display-xl mt-8 max-w-[14ch] text-ivory">
          Relationships are our <em className="text-gold">strongest commodity.</em>
        </SplitHeading>

        <div data-pillars className="mt-20 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:mt-28 lg:grid-cols-4">
          {PILLARS.map((pillar) => (
            <article key={pillar.title} data-pillar className="group relative pt-8">
              <span data-pillar-rule aria-hidden="true" className="absolute inset-x-0 top-0 block h-px origin-left bg-line-strong">
                <span className="absolute inset-y-0 left-0 w-0 bg-gold transition-[width] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-full" />
              </span>
              <p data-pillar-text className="font-serif text-xl italic text-gold">
                {pillar.numeral}.
              </p>
              <h3 data-pillar-text className="eyebrow mt-8 text-[12px] tracking-[0.28em] text-ivory">
                {pillar.title}
              </h3>
              <p data-pillar-text className="mt-5 max-w-xs text-[15.5px] leading-relaxed text-mist transition-colors duration-700 group-hover:text-ivory/85">
                {pillar.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
