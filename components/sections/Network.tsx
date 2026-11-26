"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Globe2, LocateFixed } from "lucide-react";
import { MARKETS, REGIONS } from "@/lib/content";
import { useInViewport, usePrefersReducedMotion } from "@/lib/device";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { NetworkMap } from "./network/NetworkMap";
import { ElementTable } from "./network/ElementTable";

/** The page's content edge (the shell's padding, or more on very wide screens), for the full-width map. */
const EDGE = { "--edge": "max(clamp(1.25rem, 4.6vw, 5rem), calc((100vw - 1680px) / 2 + 5rem))" } as CSSProperties;

function CornerFrame() {
  const corner = "absolute h-5 w-5 border-mark/35";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 inset-x-[var(--edge)] z-[5]">
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
  // The map opens on the whole world, then closes in on the network.
  const [zoomed, setZoomed] = useState(false);
  const zoomChosen = useRef(false);
  const lastInteraction = useRef(0);
  const hoverRef = useRef<number | null>(null);
  // Highlighted in burgundy: anything hovered, otherwise the selection. The camera follows the selection only.
  const focus = hover ?? active;

  useEffect(() => {
    hoverRef.current = hover;
  }, [hover]);

  // A moment after the map is well in view, close in on the network (once, unless the visitor chose a view).
  useEffect(() => {
    const el = mapBox.current;
    if (!el) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || zoomChosen.current) return;
        io.disconnect();
        timer = window.setTimeout(() => {
          if (zoomChosen.current) return;
          lastInteraction.current = Date.now();
          setZoomed(true);
        }, reduce ? 0 : 900);
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [reduce]);

  // Gently tour the markets while the map is on screen and idle.
  useEffect(() => {
    if (!inView || reduce) return;
    const id = window.setInterval(() => {
      if (hoverRef.current !== null || Date.now() - lastInteraction.current < 9000) return;
      setActive((a) => (a + 1) % MARKETS.length);
    }, 5600);
    return () => window.clearInterval(id);
  }, [inView, reduce]);

  const toggleZoom = useCallback(() => {
    zoomChosen.current = true;
    lastInteraction.current = Date.now();
    setZoomed((z) => !z);
  }, []);

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

        {/* The map: edge to edge across the page, opening on the whole world */}
        <Reveal className="mt-14 lg:mt-20" y={30}>
          <div className="relative ml-[calc(50%-50vw)] w-screen" style={EDGE}>
            <div ref={mapBox} className="relative h-[118vw] sm:h-[68vw] lg:h-[min(80svh,52vw)]">
              <CornerFrame />
              <NetworkMap
                focusIndex={focus}
                cameraIndex={active}
                zoomed={zoomed}
                onHover={hoverMarket}
                onSelect={select}
                calm={reduce}
              />
            </div>
            {/* beneath the map on phones, over its lower edge from sm up */}
            <div className="pointer-events-none flex items-center justify-between gap-4 px-[var(--edge)] pt-4 sm:absolute sm:inset-x-[var(--edge)] sm:bottom-0 sm:z-[5] sm:px-6 sm:pb-5 sm:pt-0">
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
              <button
                type="button"
                onClick={toggleZoom}
                aria-pressed={!zoomed}
                className="eyebrow pointer-events-auto -my-2 flex shrink-0 items-center gap-2 py-2 text-[9.5px] text-ivory transition-opacity duration-500 hover:opacity-70 sm:text-[10px]"
              >
                {zoomed ? (
                  <Globe2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <LocateFixed className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                )}
                {zoomed ? "Whole world" : "Our network"}
              </button>
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
              We value our clients&rsquo; time as much as they do, and we are candid from the first call: if we cannot
              help, we say so. Wherever possible, we go straight to the principals;
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
