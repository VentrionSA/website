"use client";

import Image from "next/image";
import { Fragment, useRef, type CSSProperties } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { BACKDROPS } from "@/lib/backdrops";
import { HERO_REGIONS } from "@/lib/content";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

/**
 * The opening view, built to Ventrion's hero design: the wake on ivory, the
 * words in Ventrion green on the misted side, and the regions set in a band
 * beneath the photograph.
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
          {/* a slow push along the wake, towards the ship: the picture is never quite still */}
          <div className="hero-drift absolute inset-0">
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
              className="mt-6 font-serif text-[min(10.1vw,4.2rem)] font-semibold leading-[0.897] tracking-[-0.033em] text-ivory md:text-[3.8rem] lg:mt-[1.3vw] lg:text-[min(6.02vw,11.6svh)]"
            >
              <span className="line-mask">
                {/* Fraunces at 400 sits with the weight of the Cormorant line below. Its optical size is held
                    at the display cut: left automatic, phones get the wider text cut and the line wraps. */}
                <span
                  className="hero-line font-accent font-normal tracking-[-0.02em]"
                  style={{ ...i(0), fontVariationSettings: '"opsz" 90' }}
                >
                  Creating opportunities.
                </span>
              </span>
              {/* the second line in the site's accent: burgundy italic */}
              <span className="line-mask">
                <span className="hero-line font-medium italic text-burgundy" style={i(1)}>
                  In every direction.
                </span>
              </span>
            </h1>

            <p
              className="hero-fade mt-6 max-w-[34rem] font-text text-[17px] leading-[1.25] tracking-[0.02em] text-ivory md:text-[20px] lg:mt-[1.86vw] lg:max-w-none lg:text-[clamp(18px,1.741vw,31px)] lg:leading-[1.2]"
              style={i(2)}
            >
              Independent trade facilitation.
            </p>
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
