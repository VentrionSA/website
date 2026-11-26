"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { LogoMark } from "@/components/brand/Logo";

/* ── The selection: many names in, one introduction out ───────────────── */

type Layout = {
  w: number;
  h: number;
  lines: number;
  /** where the outgoing line ends: the right counterpart */
  node: number;
  /** control points of the incoming curves, as x positions */
  c1: number;
  c2: number;
  rings: [number, number];
  stroke: number;
};

const WIDE: Layout = { w: 1200, h: 460, lines: 28, node: 1090, c1: 270, c2: 440, rings: [62, 98], stroke: 1.15 };
const COMPACT: Layout = { w: 640, h: 440, lines: 20, node: 590, c1: 130, c2: 220, rings: [50, 80], stroke: 1.6 };

/** A small seeded random, so the lines fall the same way on every visit. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function flowLines(l: Layout) {
  const rand = seeded(7);
  const cx = l.w / 2;
  const cy = l.h / 2;
  return Array.from({ length: l.lines }, (_, i) => {
    const t = i / (l.lines - 1);
    const y = 14 + t * (l.h - 28) + (rand() - 0.5) * 10;
    const pull = 0.04 + rand() * 0.1;
    const x0 = rand() * l.w * 0.06;
    return {
      d: `M${x0.toFixed(1)},${y.toFixed(1)} C${l.c1},${y.toFixed(1)} ${l.c2},${(cy + (y - cy) * pull).toFixed(1)} ${cx},${cy}`,
      opacity: 0.16 + rand() * 0.3,
      // a light runs along some of them, toward the centre
      pulse: i % 3 === 1,
      delay: -(rand() * 4).toFixed(2),
      speed: (3.2 + rand() * 2.4).toFixed(2),
    };
  });
}

function useCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return compact;
}

/**
 * Ventrion's role, drawn: the many names of a crowded market flow in from the left and
 * converge on the Ventrion star; a single burgundy line leaves it, straight to the one
 * counterpart that is right for the client. It draws itself once as it comes into view,
 * then light keeps moving through it.
 */
function Selection() {
  const root = useRef<HTMLDivElement>(null);
  const compact = useCompact();
  const l = compact ? COMPACT : WIDE;
  const lines = useMemo(() => flowLines(l), [l]);
  const cx = l.w / 2;
  const cy = l.h / 2;

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        el.classList.remove("is-flowing");
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top 78%", toggleActions: "play none none none" },
          onComplete: () => el.classList.add("is-flowing"),
        });
        tl.fromTo(
          "[data-flow-line]",
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", stagger: { each: 0.03, from: "edges" } },
        )
          .fromTo("[data-flow-rings]", { scale: 0.7, autoAlpha: 0, transformOrigin: "50% 50%" }, { scale: 1, autoAlpha: 1, duration: 1.1, ease: "expo.out" }, 0.7)
          .fromTo("[data-flow-star]", { scale: 0.55, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.1, ease: "expo.out" }, 0.8)
          .fromTo("[data-flow-out]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.out" }, 1.45)
          .fromTo("[data-flow-node]", { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%" }, { scale: 1, autoAlpha: 1, duration: 0.7, ease: "back.out(2.2)" }, 2.1)
          .fromTo("[data-flow-label]", { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "expo.out", stagger: 0.14 }, 1.5);
      });
      mm.add(MOTION_QUERIES.reduce, () => {
        el.classList.remove("is-flowing");
      });
    },
    { scope: root, dependencies: [compact], revertOnUpdate: true },
  );

  return (
    <div ref={root} className="relative mx-auto mt-[clamp(3.5rem,7vw,6rem)] w-full max-w-6xl">
      <div className="relative">
        <svg viewBox={`0 0 ${l.w} ${l.h}`} className="block h-auto w-full overflow-visible" aria-hidden="true">
          {/* the market: many lines, converging on Ventrion */}
          <g fill="none" strokeLinecap="round">
            {lines.map((line, i) => (
              <path
                key={`l${i}`}
                data-flow-line
                d={line.d}
                pathLength={1}
                strokeDasharray="1"
                stroke="#184335"
                strokeOpacity={line.opacity}
                strokeWidth={l.stroke}
              />
            ))}
            {lines.map((line, i) =>
              line.pulse ? (
                <path
                  key={`p${i}`}
                  d={line.d}
                  pathLength={1}
                  className="flow-pulse"
                  stroke="#184335"
                  strokeOpacity={0.75}
                  strokeWidth={l.stroke * 1.4}
                  style={{ animationDuration: `${line.speed}s`, animationDelay: `${line.delay}s` }}
                />
              ) : null,
            )}
          </g>

          {/* around the star: two fine rings, the outer one turning slowly */}
          <g data-flow-rings>
            <circle cx={cx} cy={cy} r={l.rings[0]} fill="#f4f0e6" stroke="#184335" strokeOpacity={0.28} strokeWidth={l.stroke} />
            <circle
              cx={cx}
              cy={cy}
              r={l.rings[1]}
              fill="none"
              stroke="#184335"
              strokeOpacity={0.3}
              strokeWidth={l.stroke}
              strokeDasharray={compact ? "2 7" : "2 9"}
              className="flow-ring"
            />
          </g>

          {/* one line out: direct, to the right counterpart */}
          <path
            data-flow-out
            d={`M${cx + l.rings[0]},${cy} L${l.node},${cy}`}
            pathLength={1}
            strokeDasharray="1"
            stroke="#b52336"
            strokeWidth={l.stroke * 1.8}
            strokeLinecap="round"
            fill="none"
          />
          <g data-flow-node>
            <circle cx={l.node} cy={cy} r={compact ? 16 : 18} fill="none" stroke="#b52336" strokeOpacity={0.35} strokeWidth={l.stroke} className="flow-node-ring" />
            <circle cx={l.node} cy={cy} r={compact ? 8 : 9} fill="#b52336" stroke="#f4f0e6" strokeWidth={l.stroke * 2} />
          </g>
        </svg>

        {/* the Ventrion star, exactly as the logo: upright, centred on the meeting point */}
        <span
          data-flow-star
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-mark"
          style={{ width: `${((l.rings[0] * 1.25) / l.w) * 100}%` }}
        >
          <LogoMark className="h-auto w-full" />
        </span>
      </div>

      {/* what the drawing says */}
      <div className="mt-6 grid grid-cols-3 gap-3 sm:mt-8">
        <p data-flow-label className="text-left">
          <span className="block font-serif text-[1.05rem] italic leading-tight text-ivory sm:text-[1.45rem]">Many names</span>
          <span className="eyebrow mt-2 block text-[8.5px] text-mist sm:text-[10px]">A crowded market</span>
        </p>
        <p data-flow-label className="text-center">
          <span className="block font-serif text-[1.05rem] italic leading-tight text-ivory sm:text-[1.45rem]">Ventrion</span>
          <span className="eyebrow mt-2 block text-[8.5px] text-mist sm:text-[10px]">Qualifies, then connects</span>
        </p>
        <p data-flow-label className="text-right">
          <span className="block font-serif text-[1.05rem] italic leading-tight text-burgundy sm:text-[1.45rem]">One introduction</span>
          <span className="eyebrow mt-2 block text-[8.5px] text-mist sm:text-[10px]">The right counterpart</span>
        </p>
      </div>
    </div>
  );
}

/* ── How an engagement works ───────────────────────────────────────────── */

const STEPS = [
  {
    title: "Tell us what you need.",
    body: "One candid conversation is enough to begin: the product, the volume, the timing, and what matters most to you.",
  },
  {
    title: "We find the right counterpart.",
    body: "We go to the people in our network who can genuinely deliver, and qualify them before any of your time is spent.",
  },
  {
    title: "We make the introduction.",
    body: "Personally and discreetly, with our name behind it. Then we stay close as the conversation moves forward.",
  },
];

function Steps() {
  return (
    <div className="mx-auto mt-[clamp(4.5rem,9vw,8rem)] w-full max-w-6xl text-left">
      <Reveal>
        <p className="flex items-center gap-4 font-text text-[12px] font-medium uppercase tracking-[0.2em] text-ivory sm:text-[13px]">
          <span aria-hidden="true" className="h-px w-10 bg-burgundy sm:w-12" />
          From first call to introduction
        </p>
      </Reveal>
      <Reveal as="ol" stagger={0.14} className="mt-8 grid border-t border-line md:mt-10 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            data-reveal
            className={`relative border-b border-line py-8 md:border-b-0 md:py-10 ${i > 0 ? "md:border-l md:pl-8 lg:pl-10" : ""} ${i < 2 ? "md:pr-8 lg:pr-10" : ""}`}
          >
            {/* a mark on the rule above each step: the last one in burgundy */}
            <span
              aria-hidden="true"
              className={`absolute -top-[4.5px] left-0 h-2 w-2 rounded-full ${i === 2 ? "bg-burgundy" : "bg-mark"} ${i > 0 ? "md:left-8 lg:left-10" : ""}`}
            />
            <h3 className="font-serif text-[1.6rem] leading-[1.15] text-ivory sm:text-[1.85rem]">{step.title}</h3>
            <p className="mt-4 max-w-[30rem] text-[16px] leading-[1.75] text-mist">{step.body}</p>
          </li>
        ))}
      </Reveal>
    </div>
  );
}

export function Introduction() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative isolate overflow-clip bg-ink py-[clamp(7rem,14vw,12rem)]">
      <div className="shell flex flex-col items-center text-center">
        <Eyebrow index="01" align="center">
          Independent Trade Facilitation
        </Eyebrow>
        <SplitHeading id="about-title" className="display-lg mt-8 max-w-[13ch] text-ivory">
          A private network for <em className="text-burgundy">trusted trade.</em>
        </SplitHeading>
        <Reveal stagger={0.12} className="mt-8 flex max-w-[44rem] flex-col items-center">
          <p data-reveal className="display-sm text-balance text-ivory">
            Ventrion endeavours to be a <em className="text-ivory">reliable business partner</em> to all of its commercial counterparts.
          </p>
          <p data-reveal className="mt-6 max-w-[34rem] text-[17px] leading-[1.8] text-mist">
            We facilitate trade for a private circle of clients and counterparts: candid with them, and discreet about
            them.
          </p>
        </Reveal>

        <Selection />
        <p className="sr-only">
          Many names in a crowded market; Ventrion qualifies, then connects; one introduction, to the right counterpart.
        </p>

        <Steps />
      </div>
    </section>
  );
}
