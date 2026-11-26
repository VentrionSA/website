"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { MARKETS, REGIONS } from "@/lib/content";
import { useInViewport, usePrefersReducedMotion } from "@/lib/device";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { NetworkMap, type NetworkMapHandle } from "./network/NetworkMap";
import { ElementTable } from "./network/ElementTable";

/** The page's content edge (the shell's padding, or more on very wide screens), for the full-width map. */
const EDGE = { "--edge": "max(clamp(1.25rem, 4.6vw, 5rem), calc((100vw - 1680px) / 2 + 5rem))" } as CSSProperties;
/** The fixed header's height once the page has scrolled: the map keeps clear of it. */
const HEADER = 68;

function CornerFrame() {
  const corner = "absolute h-5 w-5 border-mark/35";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute bottom-4 top-[84px] inset-x-[var(--edge)] z-[5]">
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
    </div>
  );
}

export function Network() {
  const scene = useRef<HTMLDivElement>(null);
  const mapBox = useRef<HTMLDivElement>(null);
  const map = useRef<NetworkMapHandle>(null);
  const inView = useInViewport(mapBox);
  const reduce = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const lastInteraction = useRef(0);
  const hoverRef = useRef<number | null>(null);
  const activeRef = useRef(0);
  // Highlighted in burgundy: anything hovered, otherwise the selection.
  const focus = hover ?? active;

  useEffect(() => {
    hoverRef.current = hover;
  }, [hover]);

  // The scroll drives the map: while the scene is pinned, the whole world gives way to the network.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        const state = { p: 0 };
        gsap.to(state, {
          p: 1,
          ease: "none",
          onUpdate: () => map.current?.setProgress(state.p),
          scrollTrigger: { trigger: scene.current, start: "top top", end: "bottom bottom", scrub: 0.9 },
        });
      });
    },
    { scope: scene },
  );

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Gently tour the markets while the map is on screen and idle, keeping to those in the
  // camera's view (on phones it shows part of the network at a time): a market the camera
  // leaves gives way at once to the next one on screen.
  useEffect(() => {
    if (!inView || reduce) return;
    let last = Date.now();
    const id = window.setInterval(() => {
      if (hoverRef.current !== null || Date.now() - lastInteraction.current < 9000) return;
      const shows = (i: number) => map.current?.shows(i) ?? true;
      const current = activeRef.current;
      if (Date.now() - last < 5200 && shows(current)) return;
      last = Date.now();
      for (let step = 1; step < MARKETS.length; step++) {
        const next = (current + step) % MARKETS.length;
        if (shows(next)) {
          setActive(next);
          return;
        }
      }
    }, 600);
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
      </div>

      {/* The map scene: the map holds the screen while the page scrolls on, and the scroll
          carries it from the whole world into the network. With reduced motion it is a
          still, full-width map of the network. */}
      <div ref={scene} className="relative mt-14 motion-safe:h-[300vh] lg:mt-20 lg:motion-safe:h-[260vh]" style={EDGE}>
        <div
          ref={mapBox}
          className="relative h-[118vw] overflow-hidden sm:h-[68vw] lg:h-[min(80svh,52vw)] motion-safe:sticky motion-safe:top-0 motion-safe:h-[100svh] sm:motion-safe:h-[100svh] lg:motion-safe:h-[100svh]"
        >
          <CornerFrame />
          <NetworkMap
            ref={map}
            focusIndex={focus}
            onHover={hoverMarket}
            onSelect={select}
            calm={reduce}
            still={reduce}
            topInset={reduce ? 0 : HEADER}
          />
          <div className="pointer-events-none absolute inset-x-[var(--edge)] bottom-4 z-[5] flex items-center justify-between gap-4 px-5 pb-4 sm:px-6 sm:pb-5">
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
          </div>
        </div>
      </div>

      <div className="shell relative">
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
