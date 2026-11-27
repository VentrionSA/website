"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { MARKETS, REGIONS } from "@/lib/content";
import { useGraphicsTier, useInViewport, useNearViewport, usePrefersReducedMotion } from "@/lib/device";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ElementTable } from "./network/ElementTable";

const loadGlobe = () => import("@/components/three/GlobeCanvas");
const GlobeCanvas = dynamic(loadGlobe, { ssr: false });
// Only for devices without WebGL: loaded, with the country outlines, when it is needed.
const FlatMap = dynamic(() => import("./network/FlatMap").then((m) => m.FlatMap), { ssr: false });

/** The globe's stage: as large as the screen allows, the whole sphere always in view. */
const STAGE = "w-[min(100%,calc(100svh-6.5rem),62rem)]";

function CornerFrame() {
  const corner = "absolute h-5 w-5 border-mark/35";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 inset-y-0 sm:inset-x-0">
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
  const [listHover, setListHover] = useState<number | null>(null);
  const lastInteraction = useRef(0);
  const hoverRef = useRef<number | null>(null);
  // Highlighted in burgundy: anything hovered, otherwise the selection.
  const focus = hover ?? active;
  // Faced by the globe: the selection, or a name hovered in the list. Hovering a
  // marker on the globe itself only highlights it, so the globe never moves under the pointer.
  const orient = listHover ?? active;

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

  // Gently cycle through markets while the globe is on screen and idle.
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

  const hoverListItem = useCallback((index: number | null) => {
    lastInteraction.current = Date.now();
    setHover(index);
    setListHover(index);
  }, []);

  // Dragging the globe hands it to the visitor: the tour stays paused for half a minute.
  const interact = useCallback(() => {
    lastInteraction.current = Date.now() + 18_000;
  }, []);

  return (
    <section id="network" aria-labelledby="network-title" className="relative isolate overflow-clip bg-ink py-[clamp(6rem,12vw,11rem)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mark/25 to-transparent" />

      <div className="shell relative">
        <Eyebrow index="03">The Network</Eyebrow>
        <Reveal className="mt-10">
          <p className="display-sm max-w-[30ch] text-balance text-mist">
            <em className="text-ivory">International reach</em> is not created by having thousands of names in a directory.
          </p>
        </Reveal>
        <SplitHeading id="network-title" className="display-xl mt-6 max-w-[16ch] text-balance text-ivory">
          It is created by knowing <em className="text-burgundy">who to call.</em>
        </SplitHeading>
      </div>

      {/* The globe, as large as the screen allows: edge to edge on phones */}
      <div className="relative mt-10 sm:mt-14 lg:mt-16">
        <div ref={globeBox} className={`relative mx-auto aspect-square ${STAGE}`}>
          <CornerFrame />
          {/* soft shadow grounding the porcelain globe */}
          {tier === "none" ? null : (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[93%] h-[7%] w-[60%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(24,67,53,0.16),transparent)] blur-md"
            />
          )}
          <div className="absolute inset-0">
            {tier === "none" ? (
              <FlatMap focusIndex={focus} onHover={hoverMarket} onSelect={select} />
            ) : tier !== "pending" && near ? (
              <GlobeCanvas
                focusIndex={focus}
                orientIndex={orient}
                onHover={hoverMarket}
                onSelect={select}
                onInteract={interact}
                tier={tier}
                calm={reduce}
              />
            ) : null}
          </div>
        </div>

        <div className={`mx-auto mt-5 flex items-center justify-between gap-4 px-5 sm:px-0 ${STAGE}`}>
          <p className="eyebrow flex items-center gap-3 text-[9.5px] text-mist sm:text-[10px]">
            <span aria-hidden="true" className="relative flex h-2 w-2">
              {reduce ? null : <span className="absolute inset-0 animate-ping rounded-full bg-burgundy/50" />}
              <span className="relative h-2 w-2 rounded-full bg-burgundy" />
            </span>
            <span>
              <span className="hidden sm:inline">Now highlighting </span>
              <span className="text-ivory sm:ml-1">{MARKETS[focus].name}</span>
            </span>
          </p>
          <p className="eyebrow text-right text-[9.5px] text-mist/80 sm:text-[10px]">
            {tier === "none" ? (
              "Select a market"
            ) : (
              <>
                Drag to rotate<span className="hidden sm:inline"> · Select a market</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="shell relative">
        <div className="mt-14 grid gap-14 lg:mt-20 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            {/* The markets, by region: hover, tab to or tap a name to bring it forward on the globe */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
              {REGIONS.map((region) => (
                <div key={region} className={region === "Middle East" ? "row-span-2 sm:row-span-1" : ""}>
                  <p className="eyebrow text-[10px] text-mist">{region}</p>
                  <ul className="mt-3 space-y-2">
                    {MARKETS.map((market, i) =>
                      market.region === region ? (
                        <li key={market.id}>
                          <button
                            type="button"
                            onClick={() => select(i)}
                            onMouseEnter={() => hoverListItem(i)}
                            onMouseLeave={() => hoverListItem(null)}
                            onFocus={() => hoverListItem(i)}
                            onBlur={() => hoverListItem(null)}
                            aria-pressed={i === active}
                            className={`group flex items-center gap-2.5 text-left font-serif text-[1.15rem] leading-tight text-ivory transition-opacity duration-500 sm:text-[1.25rem] ${
                              i === focus ? "italic" : "opacity-80 hover:opacity-100"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`h-1.5 w-1.5 shrink-0 rounded-full bg-burgundy transition-transform duration-500 ${
                                i === focus ? "scale-100" : "scale-0 group-hover:scale-100"
                              }`}
                            />
                            {market.name}
                          </button>
                        </li>
                      ) : null,
                    )}
                  </ul>
                </div>
              ))}
            </div>

            {/* What moves through the network: the table of elements, in the globe's colours */}
            <Reveal className="mt-14 max-w-[34rem] border-t border-line pt-10 lg:mt-16">
              <ElementTable />
            </Reveal>
          </div>

          <Reveal stagger={0.12} className="lg:col-span-4 lg:col-start-9">
            <p data-reveal className="font-serif text-[1.45rem] leading-snug text-ivory sm:text-[1.65rem]">
              The shortest path to a <em className="text-burgundy">serious</em> counterpart.
            </p>
            <p data-reveal className="mt-6 text-[16px] leading-[1.8] text-mist">
              We value our clients&rsquo; time as much as they do, and we are candid from the first call: if we cannot
              help, we say so. Wherever possible, we go straight to the principals; where we cannot, we work only through
              people we know and trust. Every counterpart is qualified before we bring them to the table, so our clients
              meet only parties who are serious and ready to do business.
            </p>
          </Reveal>
        </div>

        <p className="mt-12 text-xs leading-relaxed text-mist/70">
          Highlighted markets reflect the reach of our network. They do not indicate office locations.
        </p>
      </div>
    </section>
  );
}
