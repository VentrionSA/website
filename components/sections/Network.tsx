"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { MARKETS } from "@/lib/content";
import { useGraphicsTier, useInViewport, useNearViewport, usePrefersReducedMotion } from "@/lib/device";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { FlatMap } from "./network/FlatMap";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { BACKDROPS } from "@/lib/backdrops";

const loadGlobe = () => import("@/components/three/GlobeCanvas");
const GlobeCanvas = dynamic(loadGlobe, { ssr: false });

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

  return (
    <section id="network" aria-labelledby="network-title" className="relative isolate overflow-clip bg-graphite py-[clamp(6rem,12vw,11rem)]">
      <SectionBackdrop src={BACKDROPS.network} wash={0.74} side="both" saturate={0.4} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_40%_at_32%_58%,rgba(196,167,121,0.08),transparent_72%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="shell relative">
        <Eyebrow index="02">The Network</Eyebrow>
        <Reveal className="mt-10">
          <p className="display-sm max-w-[30ch] text-balance text-mist">
            <em className="text-burgundy">International reach</em> is not created by having thousands of names in a directory.
          </p>
        </Reveal>
        <SplitHeading id="network-title" className="display-xl mt-6 max-w-[16ch] text-balance text-ivory">
          It is created by knowing <em className="text-burgundy">who to call.</em>
        </SplitHeading>

        <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:items-center lg:gap-8">
          <div ref={globeBox} className="relative mx-auto aspect-square w-full max-w-[760px] lg:col-span-7">
            <CornerFrame />
            <div className="absolute inset-[4%]">
              {tier === "none" ? (
                <FlatMap focusIndex={focus} onHover={hoverMarket} onSelect={select} />
              ) : tier !== "pending" && near ? (
                <GlobeCanvas focusIndex={focus} onHover={hoverMarket} onSelect={select} tier={tier} calm={reduce} />
              ) : null}
            </div>
            <p className="eyebrow pointer-events-none absolute bottom-3 left-6 text-[9.5px] text-mist/80">
              {tier === "none" ? "Select a market" : "Drag to rotate · Select a market"}
            </p>
          </div>

          <Reveal stagger={0.12} className="lg:col-span-4 lg:col-start-9">
            <p data-reveal className="font-serif text-[1.45rem] leading-snug text-ivory sm:text-[1.65rem]">
              Over many years of international logistics activity, Ventrion has developed{" "}
              <em className="text-burgundy">relationships</em> with experienced
              agents and service partners across global markets.
            </p>
            <p data-reveal className="mt-6 text-[16px] leading-[1.8] text-mist">
              These relationships allow us to coordinate shipments worldwide while maintaining local knowledge and
              operational support at origin and destination.
            </p>
            <div data-reveal className="mt-10 flex items-center gap-4 border-t border-line pt-6">
              <span aria-hidden="true" className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-gold/60" />
                <span className="relative h-2 w-2 rounded-full bg-gold" />
              </span>
              <p className="eyebrow text-[10px] text-mist">
                Now highlighting <span className="ml-1 text-gold">{MARKETS[focus].name}</span>
              </p>
            </div>
          </Reveal>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-mist/70">
          Highlighted markets reflect the reach of our network. They do not indicate office locations.
        </p>
      </div>
    </section>
  );
}
