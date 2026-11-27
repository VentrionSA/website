"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { MISSION, VISION, type Statement } from "@/lib/content";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Emphasis } from "@/components/ui/Emphasis";
import { Horizon } from "./vision/Horizon";
import { Compass, COURSE } from "./vision/Compass";

function Panel({ label, drawing, content, className = "" }: { label: string; drawing: ReactNode; content: Statement; className?: string }) {
  return (
    <article className={`flex flex-col py-12 sm:py-14 lg:py-16 ${className}`}>
      <div className="w-full max-w-[30rem]">{drawing}</div>
      <Reveal stagger={0.1} className="mt-10 lg:mt-12">
        <p data-reveal className="flex items-center gap-4 font-text text-[12px] font-medium uppercase tracking-[0.2em] text-ivory sm:text-[13px]">
          <span aria-hidden="true" className="h-px w-10 bg-burgundy sm:w-12" />
          {label}
        </p>
        <p data-reveal className="mt-6 max-w-[24ch] text-balance font-serif text-[clamp(1.9rem,2.7vw,2.6rem)] font-medium leading-[1.12] text-ivory">
          <Emphasis text={content.statement} />
        </p>
        <p data-reveal className="mt-6 max-w-[32rem] text-[16px] leading-[1.75] text-mist">
          {content.support}
        </p>
      </Reveal>
    </article>
  );
}

/**
 * Where Ventrion is going, and how it travels: the vision over a horizon with the sun
 * rising, the mission over a compass with its course laid. The drawings stay alive (the
 * sea moves, the ship rides it, the course holds with a faint sway), and as they scroll
 * into view the sun climbs and the course swings in and settles.
 */
export function VisionMission() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        gsap.fromTo(
          "[data-vm-sun]",
          { y: 30 },
          { y: 0, ease: "none", scrollTrigger: { trigger: "[data-vm-sun]", start: "top bottom", end: "top 40%", scrub: 0.8 } },
        );
        gsap.fromTo(
          "[data-vm-course]",
          { rotation: COURSE - 58, svgOrigin: "150 104" },
          {
            rotation: COURSE,
            svgOrigin: "150 104",
            duration: 2.6,
            ease: "elastic.out(1, 0.42)",
            scrollTrigger: { trigger: "[data-vm-course]", start: "top 82%", toggleActions: "play none none none" },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="vision" aria-labelledby="vision-title" className="relative isolate overflow-clip bg-ink pb-[clamp(2.5rem,5vw,4rem)] pt-[clamp(6rem,12vw,11rem)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mark/25 to-transparent" />

      <div className="shell relative">
        <div className="flex flex-col items-center text-center">
          <Eyebrow index="02" align="center">
            Vision &amp; Mission
          </Eyebrow>
          <SplitHeading id="vision-title" className="display-lg mt-8 max-w-[16ch] text-balance text-ivory">
            A clear horizon. <em className="text-burgundy">A steady course.</em>
          </SplitHeading>
        </div>

        <div className="mt-14 grid border-t border-line lg:mt-20 lg:grid-cols-2">
          <Panel label="Our vision" drawing={<Horizon />} content={VISION} className="lg:pr-12 xl:pr-16" />
          <Panel
            label="Our mission"
            drawing={<Compass />}
            content={MISSION}
            className="border-t border-line lg:border-l lg:border-t-0 lg:pl-12 xl:pl-16"
          />
        </div>
      </div>
    </section>
  );
}
