"use client";

import Image from "next/image";
import { Fragment, useRef, type CSSProperties } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { BACKDROPS } from "@/lib/backdrops";
import { HERO_REGIONS } from "@/lib/content";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

/**
 * The opening view, built to Ventrion's hero design: the wake on ivory, the
 * words in Ventrion green on the misted side, a single burgundy call to action,
 * and the regions set in a band beneath the photograph.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true } as const;
        gsap.to("[data-hero-media]", { yPercent: 9, scale: 1.04, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero-copy]", { yPercent: -12, autoAlpha: 0.15, ease: "none", scrollTrigger: st });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col bg-ink">
      {/* The wake */}
      <div className="relative isolate flex min-h-[34rem] flex-1 flex-col overflow-hidden">
        <div data-hero-media aria-hidden="true" className="absolute inset-0 -z-20 origin-top will-change-transform">
          <Image
            src={BACKDROPS.hero}
            alt=""
            fill
            priority
            quality={88}
            placeholder="blur"
            sizes="(min-aspect-ratio: 195/100) 100vw, 180svh"
            className="object-cover object-[74%_50%] md:object-[80%_50%] lg:object-right"
          />
        </div>
        <div aria-hidden="true" className="hero-veil absolute inset-0 -z-10" />

        <div className="shell relative flex flex-1 flex-col justify-start pb-16 pt-[clamp(7.5rem,19svh,10.5rem)] lg:justify-center lg:pb-[5.5vw] lg:pt-[5.5vw]">
          <div data-hero-copy className="lg:pl-[0.72vw]">
            <p
              className="hero-fade font-text text-[11.5px] font-medium uppercase leading-none tracking-[0.2em] text-ivory md:text-[13px] lg:text-[clamp(12px,1.027vw,18px)]"
              style={i(0)}
            >
              Ventrion <span aria-hidden="true">/</span>
              <span className="sr-only">,</span> Global Commerce
            </p>

            <h1
              id="hero-title"
              className="mt-6 font-serif text-[min(11.6vw,4.2rem)] font-semibold leading-[0.897] tracking-[-0.033em] text-ivory md:text-[3.8rem] lg:mt-[1.3vw] lg:text-[min(6.02vw,11.6svh)]"
            >
              <span className="line-mask">
                <span className="hero-line" style={i(0)}>
                  Connecting markets.
                </span>
              </span>
              <span className="line-mask">
                <span className="hero-line" style={i(1)}>
                  Moving opportunity.
                </span>
              </span>
            </h1>

            <p
              className="hero-fade mt-6 max-w-[34rem] font-text text-[17px] leading-[1.25] tracking-[0.02em] text-ivory md:text-[20px] lg:mt-[1.86vw] lg:max-w-none lg:text-[clamp(18px,1.741vw,31px)] lg:leading-[1.2]"
              style={i(2)}
            >
              Independent trade facilitation, directly between principals.
            </p>

            <div className="hero-fade mt-9 lg:mt-[3.03vw]" style={i(3)}>
              <a
                href="/#contact"
                className="inline-flex h-[52px] items-center bg-burgundy px-7 font-text text-[17px] tracking-[0.01em] text-paper transition-colors duration-500 hover:bg-burgundy-deep lg:h-[clamp(48px,3.35vw,58px)] lg:px-[clamp(24px,1.94vw,34px)] lg:text-[clamp(17px,1.384vw,24px)]"
              >
                Start a conversation
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* The regions, in a band beneath the photograph */}
      <div className="relative flex h-[clamp(4.25rem,9svh,6rem)] items-center justify-center bg-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.7)]">
        <p className="flex items-center gap-[clamp(0.85rem,3.8vw,4rem)] font-text text-[11.5px] font-medium uppercase leading-none tracking-[0.16em] text-ivory sm:text-[13px] lg:text-[clamp(14px,1.473vw,25px)] lg:tracking-[0.145em]">
          <span aria-hidden="true" className="hidden h-px w-[6.9vw] bg-mark/45 sm:block" />
          {HERO_REGIONS.map((region, n) => (
            <Fragment key={region}>
              {n > 0 ? (
                <>
                  <span aria-hidden="true" className="h-4 w-px bg-mark/70 lg:h-[1.8vw]" />
                  <span className="sr-only">, </span>
                </>
              ) : null}
              <span className="-mr-[0.145em] whitespace-nowrap">{region}</span>
            </Fragment>
          ))}
          <span aria-hidden="true" className="hidden h-px w-[6.9vw] bg-mark/45 sm:block" />
        </p>
      </div>
    </section>
  );
}
