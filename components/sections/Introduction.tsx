"use client";

import { useRef } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { LogoMark } from "@/components/brand/Logo";

/** Oversized, scroll-driven typographic statement: "One connected network". */
function ConnectedNetwork() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        const st = { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 } as const;
        gsap.fromTo("[data-row='a']", { xPercent: 6 }, { xPercent: -10, ease: "none", scrollTrigger: st });
        gsap.fromTo("[data-row='b']", { xPercent: -8 }, { xPercent: 6, ease: "none", scrollTrigger: st });
        gsap.fromTo("[data-star]", { rotate: -45 }, { rotate: 135, ease: "none", scrollTrigger: st });
        gsap.fromTo(
          "[data-sweep]",
          { backgroundPosition: "100% 0%" },
          {
            backgroundPosition: "0% 0%",
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top 75%", end: "bottom 45%", scrub: 0.6 },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative mt-[clamp(5rem,11vw,10rem)] select-none overflow-hidden" aria-hidden="true">
      <div className="border-y border-line py-[clamp(1.5rem,3vw,3rem)]">
        <div data-row="a" className="flex items-center gap-[3vw] whitespace-nowrap will-change-transform">
          <span className="font-serif text-[clamp(4.25rem,13.5vw,15rem)] uppercase leading-[0.86] tracking-[-0.02em] text-outline">
            One
          </span>
          <span className="font-serif text-[clamp(4.25rem,13.5vw,15rem)] uppercase leading-[0.86] tracking-[-0.02em] text-ivory">
            Connected
          </span>
        </div>
        <div data-row="b" className="mt-[1vw] flex items-center justify-end gap-[3vw] whitespace-nowrap will-change-transform">
          <span data-star className="inline-block text-gold">
            <LogoMark className="h-[clamp(3rem,9vw,9.5rem)] w-auto" />
          </span>
          <span
            data-sweep
            className="font-serif text-[clamp(4.25rem,13.5vw,15rem)] uppercase italic leading-[0.86] tracking-[-0.02em]"
            style={{
              backgroundImage: "linear-gradient(90deg, #c4a779 0%, #dcc8a2 48%, transparent 52%, transparent 100%)",
              backgroundSize: "210% 100%",
              backgroundPosition: "0% 0%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextStroke: "1px rgba(196,167,121,0.55)",
            }}
          >
            Network
          </span>
        </div>
      </div>
    </div>
  );
}

export function Introduction() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative bg-ink pt-[clamp(6rem,14vw,12rem)]">
      <div className="shell grid gap-y-14 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-7">
          <Eyebrow index="01">About</Eyebrow>
          <SplitHeading id="about-title" className="display-lg mt-8 max-w-[15ch] text-ivory">
            Trade is built on trust. <em className="text-gold">Opportunity</em> is built on connection.
          </SplitHeading>
        </div>

        <Reveal stagger={0.12} className="space-y-6 text-[17px] leading-[1.75] text-mist lg:col-span-4 lg:col-start-9 lg:pt-24">
          <p data-reveal>
            International commodity markets demand more than access. They require relationships, market understanding
            and the ability to connect the right counterparties.
          </p>
          <p data-reveal>
            We operate across strategically important markets, facilitating commercial relationships and supporting
            opportunities in essential energy, agricultural, metals and food commodities.
          </p>
          <div data-reveal className="pt-4">
            <ArrowLink href="/#network" variant="text">
              Explore our network
            </ArrowLink>
          </div>
        </Reveal>
      </div>

      <ConnectedNetwork />
      <p className="sr-only">One connected network.</p>
    </section>
  );
}
