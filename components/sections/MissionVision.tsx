"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { MISSION, VALUES, VISION, type Statement } from "@/lib/content";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Emphasis } from "@/components/ui/Emphasis";
import { Ornament } from "@/components/ui/Ornament";
import { Horizon } from "./vision/Horizon";
import { Compass, COURSE } from "./vision/Compass";
import { ValuesStar } from "./vision/ValuesStar";

const LABEL = "flex items-center gap-4 font-text text-[12px] font-medium uppercase tracking-[0.2em] text-ivory sm:text-[13px]";
const STATEMENT = "mt-6 max-w-[24ch] text-balance font-serif text-[clamp(1.9rem,2.7vw,2.6rem)] font-medium leading-[1.12] text-ivory";

function Panel({ label, drawing, content, className = "" }: { label: string; drawing: ReactNode; content: Statement; className?: string }) {
  return (
    <article className={`flex flex-col py-12 sm:py-14 lg:py-16 ${className}`}>
      <div className="w-full max-w-[30rem]">{drawing}</div>
      <Reveal stagger={0.1} className="mt-10 lg:mt-12">
        <p data-reveal className={LABEL}>
          <span aria-hidden="true" className="h-px w-10 bg-burgundy sm:w-12" />
          {label}
        </p>
        <p data-reveal className={STATEMENT}>
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
 * The opening of "Mission, Vision & Values": the mission over a compass with its course
 * laid, then the vision over a horizon with the sun rising (the values follow, in
 * Values.tsx). The drawings stay alive (the course holds with a faint sway, the sea moves
 * and the ship rides it), and as they scroll into view the course swings in and settles
 * and the sun climbs.
 */
export function MissionVision() {
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
    <section ref={root} id="mission" aria-labelledby="mission-title" className="relative isolate overflow-clip bg-ink pb-[clamp(1rem,2vw,2rem)] pt-[clamp(2.5rem,5vw,4.5rem)]">
      <div className="shell relative">
        <Ornament />
        <div className="mt-[clamp(3.5rem,7vw,6rem)] flex flex-col items-center text-center">
          <Eyebrow index="03" align="center">
            Mission, Vision &amp; Values
          </Eyebrow>
          <SplitHeading id="mission-title" className="display-lg mt-8 max-w-[16ch] text-balance text-ivory">
            A steady course. <em className="text-burgundy">A clear horizon.</em>
          </SplitHeading>
        </div>

        <div className="mt-14 grid border-t border-line lg:mt-20 lg:grid-cols-2">
          <Panel label="Our mission" drawing={<Compass />} content={MISSION} className="lg:pr-12 xl:pr-16" />
          <Panel
            label="Our vision"
            drawing={<Horizon />}
            content={VISION}
            className="border-t border-line lg:border-l lg:border-t-0 lg:pl-12 xl:pl-16"
          />

          {/* The values: the third panel, across both columns from 1024px (the drawing beneath
              the mission's, the words beneath the vision's) */}
          <article className="border-t border-line py-12 sm:py-14 lg:col-span-2 lg:grid lg:grid-cols-2 lg:py-0">
            <div className="lg:py-16 lg:pr-12 xl:pr-16">
              <div className="w-full max-w-[30rem]">
                <ValuesStar />
              </div>
            </div>
            <Reveal stagger={0.1} className="mt-10 lg:mt-0 lg:border-l lg:border-line lg:py-16 lg:pl-12 xl:pl-16">
              <p data-reveal className={LABEL}>
                <span aria-hidden="true" className="h-px w-10 bg-burgundy sm:w-12" />
                Our values
              </p>
              <p data-reveal className={STATEMENT}>
                <Emphasis text="What we hold to, *in everything we facilitate.*" />
              </p>
              <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {VALUES.map((value) => (
                  <li key={value.name} data-reveal>
                    <p className="font-serif text-[1.5rem] leading-tight text-ivory">{value.name}</p>
                    <p className="mt-1.5 text-[15px] leading-[1.65] text-mist">{value.line}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </article>
        </div>
      </div>
    </section>
  );
}
