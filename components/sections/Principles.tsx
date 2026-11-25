"use client";

import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { PRINCIPLES, type PrincipleId } from "@/lib/content";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { Emphasis } from "@/components/ui/Emphasis";
import { WayWeWork } from "./principles/WayWeWork";
import { TradingHouse } from "./principles/diagrams/TradingHouse";
import warehouse from "@/assets/images/art/warehouse.webp";
import shipHold from "@/assets/images/art/ship-hold.webp";

const ART_SIZES = "(min-width: 1024px) 28rem, 100vw";

/**
 * A picture for each principle. Ventrion's own illustrations, cut out of their
 * backgrounds: a warehouse of bulk bags where one carries the red tag (one name
 * among many), and a ship's hold laden with cargo (however far it travels). The old
 * trading house is drawn in the style of the network map.
 */
const VISUALS: Record<PrincipleId, ReactNode> = {
  principals: <TradingHouse />,
  quality: (
    <Image
      src={warehouse}
      alt="A warehouse of bulk bags on pallets; one bag carries a red tag."
      sizes={ART_SIZES}
      quality={85}
      className="h-auto w-full"
    />
  ),
  distance: (
    <Image
      src={shipHold}
      alt="A cutaway of a ship's hold, laden with cargo."
      sizes={ART_SIZES}
      quality={85}
      className="h-auto w-full"
    />
  ),
};

/** "Trust does." oversized; "Trust" in burgundy italic, filled by a sweep of light as it scrolls into view. */
function TrustStatement() {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        gsap.fromTo(
          "[data-trust-sweep]",
          { backgroundPosition: "100% 0%" },
          {
            backgroundPosition: "0% 0%",
            ease: "none",
            scrollTrigger: { trigger: ref.current, start: "top 92%", end: "center 62%", scrub: 0.6 },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <h2
      ref={ref}
      id="principles-title"
      className="mt-5 font-serif text-[clamp(4.2rem,13vw,13rem)] leading-[0.95] tracking-[-0.02em] text-ivory"
    >
      <span
        data-trust-sweep
        className="mr-[-0.04em] inline-block pb-[0.14em] pl-[0.04em] pr-[0.06em] italic"
        style={{
          backgroundImage: "linear-gradient(90deg, #b52336 0%, #b52336 48%, transparent 52%, transparent 100%)",
          backgroundSize: "210% 100%",
          backgroundPosition: "0% 0%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextStroke: "1px rgba(181,35,54,0.5)",
        }}
      >
        Trust
      </span>{" "}
      does.
    </h2>
  );
}

export function Principles() {
  return (
    <section id="principles" aria-labelledby="principles-title" className="relative isolate overflow-clip bg-ink pt-[clamp(6rem,12vw,11rem)]">
      <div className="shell relative flex flex-col items-center text-center">
        <Eyebrow index="03" className="justify-center">
          Our Principles
        </Eyebrow>
        <Reveal className="mt-10">
          <p className="display-md max-w-[24ch] text-balance text-mist">
            But <em className="text-ivory">network size alone</em> is not what matters to us.
          </p>
        </Reveal>
        <TrustStatement />
      </div>

      <WayWeWork />

      {/* What we commit to: the principles, one to a row */}
      <div id="commitments" className="shell relative scroll-mt-24 py-[clamp(5rem,10vw,9rem)]">
        <Reveal>
          <p className="flex items-center gap-4 font-text text-[12px] font-medium uppercase tracking-[0.2em] text-ivory sm:text-[13px]">
            <span aria-hidden="true" className="h-px w-10 bg-burgundy sm:w-12" />
            Our commitment to you
          </p>
        </Reveal>
        <ul className="mt-10 border-t border-line lg:mt-14">
          {PRINCIPLES.map((principle) => (
            <li
              key={principle.id}
              className="grid gap-7 border-b border-line py-[clamp(3rem,6vw,5.5rem)] lg:grid-cols-12 lg:gap-8"
            >
              <Reveal className="lg:col-span-5">
                <h3 className="display-md max-w-[14ch] text-balance text-ivory">
                  <Emphasis text={principle.title} />
                </h3>
                <div className="mt-8 w-full max-w-[28rem] lg:mt-12">{VISUALS[principle.id]}</div>
              </Reveal>
              <Reveal stagger={0.1} className="lg:col-span-6 lg:col-start-7">
                <p data-reveal className="max-w-[30ch] font-serif text-[1.45rem] leading-snug text-ivory/90 sm:text-[1.6rem]">
                  <Emphasis text={principle.lead} className="text-ivory" />
                </p>
                {principle.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)} data-reveal className="mt-5 max-w-[34rem] text-[16px] leading-[1.8] text-mist">
                    {paragraph}
                  </p>
                ))}
                {principle.closing ? (
                  <p data-reveal className="mt-6 max-w-[28ch] font-serif text-[1.35rem] italic leading-snug text-ivory sm:text-[1.5rem]">
                    {principle.closing}
                  </p>
                ) : null}
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
