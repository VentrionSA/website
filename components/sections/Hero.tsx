"use client";

import { useRef, type CSSProperties } from "react";
import { gsap, MOTION_QUERIES, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { heroState } from "@/lib/hero-state";
import { SECTORS } from "@/lib/content";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { HeroVisual } from "./hero/HeroVisual";

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
        ScrollTrigger.create({
          ...st,
          onUpdate: (self) => {
            heroState.progress = self.progress;
          },
        });
      });

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        heroState.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
        heroState.pointerY = (event.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" aria-labelledby="hero-title" className="relative isolate min-h-[100svh] overflow-hidden bg-ink">
      {/* Atmosphere */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-[radial-gradient(50%_55%_at_50%_30%,rgba(196,167,121,0.11),transparent_72%)] lg:bg-[radial-gradient(42%_60%_at_66%_46%,rgba(196,167,121,0.12),transparent_72%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_120%,rgba(0,0,0,0.75),transparent_60%)]" />
      </div>

      {/* Editorial column guides */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
        <div className="shell grid h-full grid-cols-12">
          {[0, 3, 6, 9].map((col) => (
            <div key={col} className="h-full border-l border-ivory/[0.035]" style={{ gridColumnStart: col + 1 }} />
          ))}
        </div>
      </div>

      {/* 3D armillary sphere */}
      <div data-hero-visual aria-hidden="true" className="absolute inset-0 -z-10 opacity-80 lg:left-[30%] lg:opacity-100">
        <HeroVisual />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[55%] bg-gradient-to-t from-ink via-ink/70 to-transparent lg:h-[45%]" />

      <div className="shell relative flex min-h-[100svh] flex-col pb-[clamp(1.25rem,3.5vh,2.5rem)] pt-[clamp(6.5rem,15vh,9.5rem)]">
        <div data-hero-fade className="flex items-start justify-between gap-6">
          <p className="hero-fade eyebrow max-w-[18rem] text-gold sm:max-w-none" style={i(0)}>
            Independent Commodity Brokerage &amp; Advisory
          </p>
          <p className="hero-fade eyebrow hidden text-right text-mist md:block" style={i(1)}>
            Middle East <span className="px-2 text-gold/70">/</span> Central Asia <span className="px-2 text-gold/70">/</span> Asia
          </p>
        </div>

        <div data-hero-copy className="mt-auto pt-[28vh] lg:pt-16">
          <h1 id="hero-title" className="display-hero max-w-[13.5ch] text-ivory">
            <span className="line-mask">
              <span className="hero-line" style={i(0)}>
                Connecting Markets.
              </span>
            </span>
            <span className="line-mask">
              <span className="hero-line" style={i(1)}>
                Moving <em className="text-gold">Essential</em>
              </span>
            </span>
            <span className="line-mask">
              <span className="hero-line" style={i(2)}>
                Commodities.
              </span>
            </span>
          </h1>

          <div className="mt-9 grid gap-8 lg:mt-12 lg:grid-cols-12 lg:items-end">
            <p className="hero-fade max-w-[34rem] text-[15px] leading-relaxed text-mist sm:text-lg lg:col-span-5" style={i(2)}>
              An independent commodities advisory and brokerage firm connecting trusted buyers and suppliers across
              global markets in Oil &amp; Gas, Agriculture, Metals and Perishables.
            </p>
            <div className="hero-fade flex flex-col gap-3 sm:flex-row lg:col-span-7 lg:justify-end" style={i(3)}>
              <ArrowLink href="/#contact" magnetic>
                Discuss a Requirement
              </ArrowLink>
              <ArrowLink href="/#expertise" variant="outline" magnetic>
                Explore Our Expertise
              </ArrowLink>
            </div>
          </div>
        </div>

        <div data-hero-fade className="hero-fade mt-10 flex items-center justify-between border-t border-line pt-5 lg:mt-14" style={i(4)}>
          <a href="/#about" className="group flex items-center gap-4" aria-label="Scroll to explore">
            <span className="scroll-cue" aria-hidden="true" />
            <span className="eyebrow text-mist transition-colors duration-500 group-hover:text-ivory">Scroll to explore</span>
          </a>
          <ul className="eyebrow hidden items-center gap-5 text-mist md:flex" aria-label="Sectors">
            {SECTORS.map((sector, idx) => (
              <li key={sector.id} className="flex items-center gap-5">
                {idx > 0 ? <span aria-hidden="true" className="h-1 w-1 rounded-full bg-gold/60" /> : null}
                {sector.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
