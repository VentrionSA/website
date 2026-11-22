"use client";

import { useRef, type CSSProperties } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { BACKDROPS } from "@/lib/backdrops";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true } as const;
        gsap.to("[data-hero-copy]", { yPercent: -16, autoAlpha: 0.1, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero-visual]", { yPercent: 12, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero-fade]", { autoAlpha: 0, ease: "none", scrollTrigger: { ...st, end: "35% top" } });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" aria-labelledby="hero-title" className="theme-dark relative isolate min-h-[100svh] overflow-hidden bg-ink">
      <SectionBackdrop src={BACKDROPS.hero} position="50% 50%" wash={0} side="none" edges={false} priority />
      {/* Minimal shade, only where the words sit, so the photograph stays untouched */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(0deg,rgba(8,14,24,0.72)_0%,rgba(8,14,24,0.38)_42%,rgba(8,14,24,0.08)_70%,rgba(8,14,24,0.3)_100%)] lg:bg-[linear-gradient(90deg,rgba(8,14,24,0.58)_0%,rgba(8,14,24,0.26)_36%,rgba(8,14,24,0)_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-20 hidden h-[46%] bg-[linear-gradient(0deg,rgba(8,14,24,0.5)_0%,rgba(8,14,24,0)_100%)] lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-20 hidden h-[20%] bg-[linear-gradient(180deg,rgba(8,14,24,0.34)_0%,rgba(8,14,24,0)_100%)] lg:block"
      />
      {/* Editorial column guides */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
        <div className="shell grid h-full grid-cols-12">
          {[0, 3, 6, 9].map((col) => (
            <div key={col} className="h-full border-l border-ivory/[0.035]" style={{ gridColumnStart: col + 1 }} />
          ))}
        </div>
      </div>

      
      <div className="shell relative flex min-h-[100svh] flex-col pb-[clamp(1.25rem,3.5vh,2.5rem)] pt-[clamp(6.5rem,15vh,9.5rem)]">
        <div data-hero-fade className="flex items-start justify-between gap-6">
          <p className="hero-fade eyebrow max-w-[18rem] text-gold sm:max-w-none" style={i(0)}>
            Global Trade Facilitation
          </p>
          <p className="hero-fade eyebrow hidden text-right text-ivory/75 md:block" style={i(1)}>
            Middle East <span className="px-2 text-gold/70">/</span> Central Asia <span className="px-2 text-gold/70">/</span> Asia
          </p>
        </div>

        <div data-hero-copy className="mt-auto lg:pt-6">
          <h1 id="hero-title" className="display-hero text-ivory">
            <span className="line-mask">
              <span className="hero-line" style={i(0)}>
                Connecting
              </span>
            </span>
            <span className="line-mask">
              <span className="hero-line" style={i(1)}>
                Global <em className="text-gold-soft">Markets.</em>
              </span>
            </span>
          </h1>

          <div className="mt-9 grid gap-8 lg:mt-10 lg:grid-cols-12 lg:items-end">
            <p className="hero-fade max-w-[30rem] text-[15px] leading-relaxed text-ivory/85 sm:text-lg lg:col-span-5" style={i(2)}>
              <span className="text-[0.86em] font-medium uppercase tracking-[0.2em] text-ivory">Ventrion</span> is the
              meeting point between buyers and sellers, facilitating trade through a uniquely extensive network.
            </p>
            <div className="hero-fade flex flex-col gap-3 sm:flex-row lg:col-span-7 lg:justify-end" style={i(3)}>
              <ArrowLink href="/#contact" magnetic>
                Request an Introduction
              </ArrowLink>
              <ArrowLink href="/#network" variant="outline" magnetic>
                The Network
              </ArrowLink>
            </div>
          </div>
        </div>

        {/* Scroll fade (GSAP) on the wrapper, entrance animation (CSS) on the row: GSAP must not read a mid-animation opacity. */}
        <div data-hero-fade className="mt-10">
          <div className="hero-fade flex items-center justify-between border-t border-line pt-5" style={i(4)}>
            <a href="/#about" className="group flex items-center gap-4" aria-label="Scroll to explore">
              <span className="scroll-cue" aria-hidden="true" />
              <span className="eyebrow text-ivory/75 transition-colors duration-500 group-hover:text-ivory">Scroll</span>
            </a>
            <p className="eyebrow hidden items-center gap-5 text-ivory/75 md:flex">
              Buyers
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-gold/70" />
              Ventrion
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-gold/70" />
              Sellers
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
