"use client";

import { useRef } from "react";
import { gsap, MOTION_QUERIES, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { PROCESS, PROCESS_INTRO } from "@/lib/content";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { BACKDROPS } from "@/lib/backdrops";

export function Approach() {
  const root = useRef<HTMLElement>(null);
  const pinArea = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const steps = () => gsap.utils.toArray<HTMLElement>("[data-step]");
      const setActive = (progress: number) => {
        const list = steps();
        const activeCount = Math.min(list.length, Math.floor(progress * list.length + 0.15));
        list.forEach((step, i) => step.toggleAttribute("data-active", i < Math.max(1, activeCount)));
      };

      // Desktop: pin the stage and draw a horizontal gold line through the four steps.
      mm.add(`${MOTION_QUERIES.motion} and ${MOTION_QUERIES.desktop}`, () => {
        gsap.set("[data-line-fill]", { scaleX: 0, transformOrigin: "0% 50%" });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinArea.current,
            start: "top top",
            end: "+=170%",
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            onUpdate: (self) => setActive(self.progress),
          },
        });
        tl.to("[data-line-fill]", { scaleX: 1, ease: "none" });
        setActive(0);
      });

      // Mobile/tablet: a vertical line fills as the steps scroll past.
      mm.add(`${MOTION_QUERIES.motion} and ${MOTION_QUERIES.mobile}`, () => {
        gsap.set("[data-vline-fill]", { scaleY: 0, transformOrigin: "50% 0%" });
        gsap.to("[data-vline-fill]", {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: "[data-steps]", start: "top 70%", end: "bottom 60%", scrub: 0.6 },
        });
        steps().forEach((step) => {
          ScrollTrigger.create({
            trigger: step,
            start: "top 68%",
            onEnter: () => step.setAttribute("data-active", ""),
            onLeaveBack: () => step.removeAttribute("data-active"),
          });
        });
      });

      // Reduced motion: everything shown, fully drawn.
      mm.add(MOTION_QUERIES.reduce, () => {
        steps().forEach((step) => step.setAttribute("data-active", ""));
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="approach" aria-labelledby="approach-title" className="relative bg-coal">
      <div ref={pinArea} className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden py-[clamp(6rem,10vw,9rem)]">
        <SectionBackdrop src={BACKDROPS.approach} wash={0.84} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_80%_0%,rgba(196,167,121,0.08),transparent_70%)]"
        />
        <div className="shell relative">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Eyebrow index="05">Our Approach</Eyebrow>
              <SplitHeading id="approach-title" className="display-lg mt-8 max-w-[15ch] text-ivory">
                Every opportunity deserves a <em className="text-gold">considered</em> process.
              </SplitHeading>
            </div>
            <p className="max-w-md text-[16px] leading-relaxed text-mist lg:col-span-4 lg:col-start-9">{PROCESS_INTRO}</p>
          </div>

          <div data-steps className="relative mt-16 lg:mt-24">
            {/* Horizontal track (desktop) */}
            <div aria-hidden="true" className="absolute left-0 right-0 top-[7px] hidden h-px bg-line-strong lg:block">
              <div data-line-fill className="absolute inset-0 bg-gradient-to-r from-gold via-gold-soft to-gold" />
            </div>
            {/* Vertical track (mobile) */}
            <div aria-hidden="true" className="absolute bottom-0 left-[7px] top-0 w-px bg-line-strong lg:hidden">
              <div data-vline-fill className="absolute inset-0 bg-gradient-to-b from-gold to-gold-soft" />
            </div>

            <ol className="grid gap-14 lg:grid-cols-4 lg:gap-8">
              {PROCESS.map((step) => (
                <li key={step.index} data-step data-active="" className="group relative pl-12 lg:pl-0 lg:pr-6">
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 flex h-[15px] w-[15px] items-center justify-center rounded-full border border-line-strong bg-coal transition-colors duration-700 group-data-[active]:border-gold"
                  >
                    <span className="h-[5px] w-[5px] rounded-full bg-mist/40 transition-colors duration-700 group-data-[active]:bg-gold" />
                  </span>
                  <div className="opacity-40 transition-opacity duration-700 group-data-[active]:opacity-100 lg:pt-12">
                    <p className="font-serif text-[clamp(4rem,7vw,7.5rem)] leading-none tracking-[-0.03em] text-outline transition-colors duration-700 group-data-[active]:text-outline-gold">
                      {step.index}
                    </p>
                    <h3 className="eyebrow mt-6 text-[12px] tracking-[0.3em] text-ivory">{step.title}</h3>
                    <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-mist">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
