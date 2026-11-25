"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MARKETS, REGIONS } from "@/lib/content";
import { useInViewport, usePrefersReducedMotion } from "@/lib/device";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { NetworkMap } from "./network/NetworkMap";
import { ElementTable } from "./network/ElementTable";

function CornerFrame() {
  const corner = "absolute h-5 w-5 border-mark/35";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
    </div>
  );
}

export function Network() {
  const mapBox = useRef<HTMLDivElement>(null);
  const inView = useInViewport(mapBox);
  const reduce = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const lastInteraction = useRef(0);
  const hoverRef = useRef<number | null>(null);
  // Highlighted in burgundy: anything hovered, otherwise the selection.
  const focus = hover ?? active;

  useEffect(() => {
    hoverRef.current = hover;
  }, [hover]);

  // Gently tour the markets while the map is on screen and idle.
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
    <section id="network" aria-labelledby="network-title" className="relative isolate overflow-clip bg-ink py-[clamp(6rem,12vw,11rem)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mark/25 to-transparent" />

      <div className="shell relative">
        <Eyebrow index="02">The Network</Eyebrow>
        <Reveal className="mt-10">
          <p className="display-sm max-w-[30ch] text-balance text-mist">
            <em className="text-ivory">International reach</em> is not created by having thousands of names in a directory.
          </p>
        </Reveal>
        <SplitHeading id="network-title" className="display-xl mt-6 max-w-[16ch] text-balance text-ivory">
          It is created by knowing <em className="text-burgundy">who to call.</em>
        </SplitHeading>

        {/* The map: the full width of the page from the Mediterranean to the Pacific */}
        <Reveal className="mt-14 lg:mt-20" y={30}>
          <div
            ref={mapBox}
            className="relative -mx-[clamp(1.25rem,4.6vw,5rem)] aspect-[5/4] overflow-hidden sm:mx-0 sm:aspect-[16/10] lg:aspect-[2/1]"
          >
            <CornerFrame />
            <NetworkMap focusIndex={focus} onHover={hoverMarket} onSelect={select} calm={reduce} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] flex items-end justify-between gap-4 px-5 pb-4 sm:px-6 sm:pb-5">
              <p className="eyebrow flex items-center gap-3 text-[9.5px] text-mist sm:text-[10px]">
                <span aria-hidden="true" className="relative flex h-2 w-2">
                  {reduce ? null : <span className="absolute inset-0 animate-ping rounded-full bg-burgundy/50" />}
                  <span className="relative h-2 w-2 rounded-full bg-burgundy" />
                </span>
                <span>
                  Now highlighting <span className="ml-1 text-ivory">{MARKETS[focus].name}</span>
                </span>
              </p>
              <p className="eyebrow hidden text-[9.5px] text-mist/80 sm:block">Select a market</p>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-14 lg:mt-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            {/* The markets, by region: hover, tab to or tap a name to bring it forward on the map */}
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
                            onMouseEnter={() => hoverMarket(i)}
                            onMouseLeave={() => hoverMarket(null)}
                            onFocus={() => hoverMarket(i)}
                            onBlur={() => hoverMarket(null)}
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

            {/* What moves through the network: the table of elements, in the map's colours */}
            <Reveal className="mt-14 max-w-[34rem] border-t border-line pt-10 lg:mt-16">
              <ElementTable />
            </Reveal>
          </div>

          <Reveal stagger={0.12} className="lg:col-span-4 lg:col-start-9">
            <p data-reveal className="font-serif text-[1.45rem] leading-snug text-ivory sm:text-[1.65rem]">
              The shortest path to a <em className="text-burgundy">serious</em> counterpart.
            </p>
            <p data-reveal className="mt-6 text-[16px] leading-[1.8] text-mist">
              We value our clients&rsquo; time as much as they do. Wherever possible, we go straight to the principals;
              where we cannot, we work only through people we know and trust. Every counterpart is qualified before an
              introduction is made, so our clients meet only parties who are serious and ready to do business.
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
