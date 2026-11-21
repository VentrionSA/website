"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CONNECTIONS, MARKETS, REGIONS } from "@/lib/content";
import { useGraphicsTier, useInViewport, useNearViewport, usePrefersReducedMotion } from "@/lib/device";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { FlatMap } from "./network/FlatMap";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { BACKDROPS } from "@/lib/backdrops";

const loadGlobe = () => import("@/components/three/GlobeCanvas");
const GlobeCanvas = dynamic(loadGlobe, { ssr: false });

const EASE = [0.22, 1, 0.36, 1] as const;

function formatCoord(value: number, pos: string, neg: string) {
  return `${Math.abs(value).toFixed(1)}° ${value >= 0 ? pos : neg}`;
}

function linkedMarkets(index: number) {
  return CONNECTIONS.filter(([a, b]) => a === index || b === index).map(([a, b]) => MARKETS[a === index ? b : a].name);
}

function MarketPanel({ index, onStep }: { index: number; onStep: (dir: 1 | -1) => void }) {
  const market = MARKETS[index];
  return (
    <div className="relative">
      <div className="flex items-center justify-between border-b border-line pb-5">
        <p className="eyebrow tabular-nums text-mist">
          <span className="text-gold">{String(index + 1).padStart(2, "0")}</span> / {String(MARKETS.length).padStart(2, "0")}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onStep(-1)}
            aria-label="Previous market"
            className="flex h-10 w-10 items-center justify-center border border-line-strong text-ivory transition-colors duration-500 hover:border-gold hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onStep(1)}
            aria-label="Next market"
            className="flex h-10 w-10 items-center justify-center border border-line-strong text-ivory transition-colors duration-500 hover:border-gold hover:text-gold"
          >
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative min-h-[240px] pt-8" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={market.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <p className="eyebrow text-gold">{market.region}</p>
            <h3 className="display-md mt-4 text-ivory">{market.name}</h3>
            <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-6 text-sm">
              <div>
                <dt className="eyebrow text-[10px] text-mist">Position</dt>
                <dd className="mt-2 font-mono text-[12px] tabular-nums text-ivory/85">
                  {formatCoord(market.lat, "N", "S")} · {formatCoord(market.lon, "E", "W")}
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-[10px] text-mist">Linked markets</dt>
                <dd className="mt-2 text-[13px] leading-relaxed text-ivory/85">{linkedMarkets(index).join(" · ")}</dd>
              </div>
            </dl>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function CornerFrame() {
  const corner = "absolute h-5 w-5 border-gold/40";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
    </div>
  );
}

export function Network() {
  const globeBox = useRef<HTMLDivElement>(null);
  const near = useNearViewport(globeBox, "900px 0px");
  const inView = useInViewport(globeBox);
  // Reduced-motion visitors still get the 3D globe, with ambient motion stilled.
  const tier = useGraphicsTier({ allowReducedMotion: true });
  const reduce = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const lastInteraction = useRef(0);
  const hoverRef = useRef<number | null>(null);
  const focus = hover ?? active;

  useEffect(() => {
    hoverRef.current = hover;
  }, [hover]);

  // Warm the 3D bundle shortly after load so the globe is ready before it is reached.
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const run = () => void loadGlobe();
    if (w.requestIdleCallback) w.requestIdleCallback(run);
    else window.setTimeout(run, 1500);
  }, []);

  // Gently cycle through markets while the section is on screen and idle.
  useEffect(() => {
    if (!inView || reduce) return;
    const id = window.setInterval(() => {
      if (hoverRef.current !== null || Date.now() - lastInteraction.current < 12000) return;
      setActive((a) => (a + 1) % MARKETS.length);
    }, 4600);
    return () => window.clearInterval(id);
  }, [inView, reduce]);

  const select = useCallback((index: number) => {
    lastInteraction.current = Date.now();
    setActive(index);
  }, []);

  const hoverMarket = useCallback((index: number | null) => {
    lastInteraction.current = Date.now();
    setHover(index);
  }, []);

  const step = useCallback((dir: 1 | -1) => {
    lastInteraction.current = Date.now();
    setHover(null);
    setActive((a) => (a + dir + MARKETS.length) % MARKETS.length);
  }, []);

  return (
    <section id="network" aria-labelledby="network-title" className="relative isolate overflow-clip bg-graphite py-[clamp(6rem,12vw,11rem)]">
      <SectionBackdrop src={BACKDROPS.network} wash={0.66} side="both" saturate={0.45} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_40%_at_32%_58%,rgba(196,167,121,0.08),transparent_72%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="shell relative">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow index="02">The Network</Eyebrow>
            <SplitHeading id="network-title" className="display-lg mt-8 max-w-[13ch] text-ivory">
              A uniquely extensive <em className="text-gold">network.</em>
            </SplitHeading>
          </div>
          <Reveal stagger={0.1} className="space-y-4 lg:col-span-4 lg:col-start-9">
            <p data-reveal className="display-sm text-ivory/90">
              Nine markets. One network.
            </p>
            <p data-reveal className="text-[16px] leading-relaxed text-mist">
              Relationships spanning the Middle East, Central Asia and Asia give Ventrion the reach to bring buyers and
              sellers into direct contact.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:items-center lg:gap-8">
          <div ref={globeBox} className="relative mx-auto aspect-square w-full max-w-[780px] lg:col-span-7">
            <CornerFrame />
            <div className="absolute inset-[4%]">
              {tier === "none" ? (
                <FlatMap focusIndex={focus} onHover={hoverMarket} onSelect={select} />
              ) : tier !== "pending" && near ? (
                <GlobeCanvas focusIndex={focus} onHover={hoverMarket} onSelect={select} tier={tier} calm={reduce} />
              ) : null}
            </div>
            <p className="eyebrow pointer-events-none absolute bottom-3 left-6 text-[9.5px] text-mist/70">
              {tier === "none" ? "Network map" : "Drag to rotate"}
            </p>
            <p className="eyebrow pointer-events-none absolute right-6 top-3 text-[9.5px] text-mist/70">Network view</p>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <MarketPanel index={focus} onStep={step} />
          </div>
        </div>

        {/* Compact market index: hover or tap a name to bring it to the front of the globe */}
        <div className="mt-14 border-t border-line lg:mt-20">
          {REGIONS.map((region) => (
            <div key={region} className="grid gap-3 border-b border-line py-6 md:grid-cols-12 md:items-baseline md:gap-8">
              <p className="eyebrow text-gold md:col-span-3">{region}</p>
              <ul className="flex flex-wrap items-baseline gap-x-8 gap-y-2 md:col-span-9">
                {MARKETS.map((market, i) =>
                  market.region === region ? (
                    <li key={market.id}>
                      <button
                        type="button"
                        onClick={() => select(i)}
                        onMouseEnter={() => hoverMarket(i)}
                        onMouseLeave={() => hoverMarket(null)}
                        onFocus={() => hoverMarket(i)}
                        onBlur={() => hoverMarket(null)}
                        aria-pressed={i === active}
                        className={`font-serif text-[1.4rem] leading-tight transition-colors duration-500 sm:text-[1.65rem] ${
                          i === focus ? "text-gold" : "text-ivory hover:text-gold"
                        }`}
                      >
                        {market.name}
                      </button>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-mist/70">
          Markets reflect the reach of our network. They do not indicate office locations.
        </p>
      </div>
    </section>
  );
}
