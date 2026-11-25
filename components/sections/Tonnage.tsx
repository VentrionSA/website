"use client";

import { useRef, type CSSProperties } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";

/** Metric tonnes Ventrion has been part of to date, as broker or as principal. */
const TOTAL_MT = 400_000;
const format = (n: number) => Math.round(n).toLocaleString("en-US");

/*
 * The weight.
 *
 * One figure, given without detail: no commodities, no years, no counterparties,
 * and no word on whether Ventrion stood in the middle or at the end of the trade.
 * It appears as an outline, fills, holds long enough to be read beyond doubt,
 * then empties and dissolves into the page, leaving only the line that explains
 * why nothing more is said: the particulars remain under seal. Appearance as disappearance.
 */

const figureStyle: CSSProperties = {
  // the fill passes through the outline: in from the right, out to the left
  backgroundImage:
    "linear-gradient(90deg, transparent 0%, transparent 30%, var(--color-ivory) 34%, var(--color-ivory) 66%, transparent 70%, transparent 100%)",
  backgroundSize: "300% 100%",
  backgroundPosition: "50% 0%",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextStroke: "1px rgb(18 59 48 / 0.3)",
  fontVariantNumeric: "lining-nums tabular-nums",
};

export function Tonnage() {
  const root = useRef<HTMLElement>(null);
  const figure = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        const el = figure.current;
        if (!el) return;

        // The count runs once, as the figure first comes into view.
        const counter = { value: 0 };
        el.textContent = format(0);
        gsap.to(counter, {
          value: TOTAL_MT,
          duration: 2.8,
          ease: "power3.out",
          onUpdate: () => {
            el.textContent = format(counter.value);
          },
          scrollTrigger: { trigger: "[data-ton-stage]", start: "top 72%", once: true },
        });

        // Appearance, a long hold, then disappearance, scrubbed through the pinned stage.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.9 },
        });
        tl.fromTo("[data-ton-plumb]", { scaleY: 0, transformOrigin: "50% 0%" }, { scaleY: 1, duration: 0.18 }, 0)
          .fromTo("[data-ton-eyebrow]", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.04)
          .fromTo("[data-ton-figure]", { backgroundPosition: "0% 0%" }, { backgroundPosition: "50% 0%", duration: 0.22 }, 0)
          .fromTo("[data-ton-rule]", { scaleX: 0 }, { scaleX: 1, duration: 0.16 }, 0.08)
          .fromTo("[data-ton-unit]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.1)
          .fromTo("[data-ton-caption]", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.14)
          // hold: 0.26 → 0.52
          .to("[data-ton-figure]", { backgroundPosition: "100% 0%", duration: 0.2 }, 0.52)
          .to(["[data-ton-caption]", "[data-ton-eyebrow]", "[data-ton-unit]"], { autoAlpha: 0, duration: 0.1 }, 0.54)
          .to("[data-ton-rule]", { scaleX: 0, duration: 0.12 }, 0.54)
          .to("[data-ton-plumb]", { scaleY: 0, transformOrigin: "50% 100%", duration: 0.14 }, 0.56)
          .to("[data-ton-figure]", { autoAlpha: 0.08, filter: "blur(5px)", scale: 1.04, duration: 0.26 }, 0.62)
          .fromTo("[data-ton-rest]", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.14 }, 0.72)
          // hold the closing line until the stage releases
          .to({}, { duration: 0.12 }, 0.88);
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="weight"
      aria-labelledby="weight-title"
      className="relative bg-ink motion-safe:h-[260vh]"
    >
      <h2 id="weight-title" className="sr-only">
        400,000 metric tonnes, to date
      </h2>
      <p className="sr-only">
        The weight of what Ventrion has been part of, to date: 400,000 metric tonnes. The particulars remain under seal.
      </p>

      <div
        data-ton-stage
        aria-hidden="true"
        className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden py-24 motion-safe:sticky motion-safe:top-0 motion-safe:h-[100svh] motion-safe:py-0"
      >
        {/* A plumb line: the figure hangs from it */}
        <span
          data-ton-plumb
          className="absolute left-1/2 top-0 hidden h-[calc(50%-clamp(7rem,15vw,13.5rem))] w-px bg-gradient-to-b from-transparent via-mark/20 to-mark/45 motion-safe:block"
        />

        <div className="relative flex flex-col items-center text-center">
          <p data-ton-eyebrow className="eyebrow text-mist">
            To date
          </p>

          <span
            ref={figure}
            data-ton-figure
            className="mt-7 block whitespace-nowrap font-serif text-[clamp(5rem,24vw,19rem)] font-light leading-[0.92] tracking-[-0.02em] will-change-[filter,transform]"
            style={figureStyle}
          >
            {format(TOTAL_MT)}
          </span>

          <span data-ton-unit className="mt-7 flex items-center gap-5">
            <span data-ton-rule className="h-px w-[min(16vw,13rem)] origin-right bg-mark/40" />
            <span className="-mr-[0.42em] font-text text-[13px] uppercase tracking-[0.42em] text-ivory sm:text-[14px]">MT</span>
            <span data-ton-rule className="h-px w-[min(16vw,13rem)] origin-left bg-mark/40" />
          </span>

          <p
            data-ton-caption
            className="mt-10 max-w-[22ch] font-serif text-[clamp(1.4rem,2.3vw,2.05rem)] italic leading-snug text-ivory"
          >
            The weight of what we have been part of.
          </p>
        </div>

        <p
          data-ton-rest
          className="mt-14 px-6 text-center font-serif text-[clamp(2.1rem,4.6vw,4.25rem)] font-medium leading-[1.02] text-ivory motion-safe:absolute motion-safe:inset-x-0 motion-safe:top-1/2 motion-safe:mt-0 motion-safe:-translate-y-1/2"
        >
          The particulars remain <em className="text-burgundy">under seal.</em>
        </p>
      </div>
    </section>
  );
}
