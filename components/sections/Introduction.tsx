"use client";

import { useRef } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { LogoMark } from "@/components/brand/Logo";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { BACKDROPS } from "@/lib/backdrops";

/** Buyers and sellers drawn together, meeting at the Ventrion star. */
function MeetingPoint() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top 88%", end: "center 52%", scrub: 0.8 },
        });
        tl.fromTo("[data-line='l']", { scaleX: 0 }, { scaleX: 1 }, 0)
          .fromTo("[data-line='r']", { scaleX: 0 }, { scaleX: 1 }, 0)
          .fromTo("[data-side='l']", { x: -24, autoAlpha: 0.25 }, { x: 0, autoAlpha: 1 }, 0)
          .fromTo("[data-side='r']", { x: 24, autoAlpha: 0.25 }, { x: 0, autoAlpha: 1 }, 0)
          .fromTo("[data-star]", { rotate: -135, scale: 0.55, autoAlpha: 0.3 }, { rotate: 0, scale: 1, autoAlpha: 1 }, 0.25)
          .fromTo("[data-star-glow]", { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1 }, 0.55);
      });
    },
    { scope: root },
  );

  const side = "font-serif text-[clamp(1.45rem,3.8vw,3.25rem)] italic leading-none text-ivory";

  return (
    <div ref={root} aria-hidden="true" className="mt-[clamp(3.5rem,7vw,6rem)] flex w-full max-w-5xl items-center gap-3 sm:gap-7">
      <span data-side="l" className={side}>
        Buyers
      </span>
      <span className="relative h-px flex-1">
        <span data-line="l" className="absolute inset-0 origin-left bg-gradient-to-r from-ivory/15 via-gold/50 to-gold" />
      </span>
      <span className="relative flex flex-col items-center">
        <span
          data-star-glow
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(220,200,162,0.35),transparent_68%)]"
        />
        <span data-star className="relative text-gold-soft">
          <LogoMark className="h-[clamp(2.6rem,6vw,4.75rem)] w-auto" />
        </span>
      </span>
      <span className="relative h-px flex-1">
        <span data-line="r" className="absolute inset-0 origin-right bg-gradient-to-l from-ivory/15 via-gold/50 to-gold" />
      </span>
      <span data-side="r" className={side}>
        Sellers
      </span>
    </div>
  );
}

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
        gsap.fromTo("[data-row-star]", { rotate: -45 }, { rotate: 135, ease: "none", scrollTrigger: st });
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
    <div ref={root} className="relative mt-[clamp(5rem,10vw,9rem)] select-none overflow-hidden" aria-hidden="true">
      <div className="border-y border-line py-[clamp(1.5rem,3vw,3rem)]">
        <div data-row="a" className="flex items-center gap-[3vw] whitespace-nowrap will-change-transform">
          <span className="font-serif text-[clamp(3.4rem,11.2vw,12.75rem)] uppercase leading-[0.86] tracking-[-0.02em] text-outline">
            One
          </span>
          <span className="font-serif text-[clamp(3.4rem,11.2vw,12.75rem)] uppercase leading-[0.86] tracking-[-0.02em] text-ivory">
            Connected
          </span>
        </div>
        <div data-row="b" className="mt-[1vw] flex items-center justify-end gap-[3vw] whitespace-nowrap will-change-transform">
          <span data-row-star className="inline-block text-gold">
            <LogoMark className="h-[clamp(2.6rem,7.8vw,8.25rem)] w-auto" />
          </span>
          <span
            data-sweep
            className="font-serif text-[clamp(3.4rem,11.2vw,12.75rem)] uppercase italic leading-[0.86] tracking-[-0.02em]"
            style={{
              backgroundImage: "linear-gradient(90deg, #8d6b3b 0%, #b08a52 48%, transparent 52%, transparent 100%)",
              backgroundSize: "210% 100%",
              backgroundPosition: "0% 0%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextStroke: "1px rgba(141,107,59,0.55)",
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
    <section id="about" aria-labelledby="about-title" className="relative isolate overflow-clip bg-ink pt-[clamp(7rem,14vw,12rem)]">
      <SectionBackdrop src={BACKDROPS.about} wash={0.72} side="both" saturate={0.55} />
      <div className="shell flex flex-col items-center text-center">
        <Eyebrow index="01" className="justify-center">
          The Meeting Point
        </Eyebrow>
        <SplitHeading id="about-title" className="display-lg mt-8 max-w-[13ch] text-ivory">
          Where buyers and sellers <em className="text-burgundy">meet.</em>
        </SplitHeading>

        <MeetingPoint />
        <p className="sr-only">Ventrion stands between buyers and sellers, bringing them together.</p>

        <Reveal stagger={0.12} className="mt-[clamp(3.5rem,7vw,6rem)] flex max-w-[44rem] flex-col items-center">
          <p data-reveal className="display-sm text-ivory">
            Ventrion endeavours to be a <em className="text-burgundy">reliable business partner</em> to all of its commercial counterparts.
          </p>
          <p data-reveal className="mt-6 max-w-[34rem] text-[17px] leading-[1.8] text-mist">
            We exist to facilitate trade, bringing the right buyers and the right sellers together, directly and with
            discretion.
          </p>
        </Reveal>
      </div>

      <ConnectedNetwork />
      <p className="sr-only">One connected network.</p>
    </section>
  );
}
