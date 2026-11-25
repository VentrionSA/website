"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { MARKETS } from "@/lib/content";
import { LAND_PATH, MAP_PROJECTION, MAP_SIZE, NETWORK_PATHS } from "@/lib/geo/network-map";

const { width: MW, height: MH } = MAP_SIZE;

/** Latitude and longitude to map units (the same projection the outlines were built with). */
function project(lat: number, lon: number) {
  const { lonMin, latMax, k, cos } = MAP_PROJECTION;
  return { x: (lon - lonMin) * k * cos, y: (latMax - lat) * k };
}

const POINTS = MARKETS.map((m) => project(m.lat, m.lon));

/** The land fades out towards the edges of the frame. */
const EDGE_FADE =
  "linear-gradient(90deg,transparent 0%,#000 7%,#000 93%,transparent 100%),linear-gradient(180deg,transparent 0%,#000 6%,#000 94%,transparent 100%)";

/** A gentle arc between two markets, bowed to the north like a flight path. */
function arcPath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${mx.toFixed(1)},${(my - dist * 0.28).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}

/** How the map (viewBox, sliced) sits in its box: used to place the HTML markers over it. */
function useSlice(ref: React.RefObject<HTMLDivElement | null>) {
  const [slice, setSlice] = useState<{ s: number; ox: number; oy: number; w: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      const s = Math.max(width / MW, height / MH);
      setSlice({ s, ox: (width - MW * s) / 2, oy: (height - MH * s) / 2, w: width });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return slice;
}

/** The countries: drawn once, never re-rendered as the focus moves. */
const Countries = memo(function Countries({
  onHover,
  onSelect,
}: {
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
}) {
  const graticule = useMemo(() => {
    const lines: string[] = [];
    for (let lon = 10; lon <= 160; lon += 10) {
      const x = project(0, lon).x.toFixed(1);
      lines.push(`M${x},0V${MH}`);
    }
    for (let lat = -10; lat <= 50; lat += 10) {
      const y = project(lat, 0).y.toFixed(1);
      lines.push(`M0,${y}H${MW.toFixed(1)}`);
    }
    return lines.join("");
  }, []);

  return (
    <>
      <path d={graticule} fill="none" stroke="rgb(24 67 53 / 0.07)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <g style={{ filter: "drop-shadow(0 10px 18px rgb(24 67 53 / 0.08))" }}>
        <path d={LAND_PATH} fill="#d9ddd2" stroke="#f4f0e6" strokeWidth={0.8} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {MARKETS.map((market, i) => (
          <path
            key={market.id}
            d={NETWORK_PATHS[market.id]}
            data-market={i}
            fill="#5b796c"
            stroke="#f4f0e6"
            strokeWidth={0.8}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="cursor-pointer transition-[fill] duration-500 hover:fill-[#4a6a5d]"
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(i)}
          />
        ))}
      </g>
    </>
  );
});

/**
 * The network on a flat map, in the site's colours: the markets' countries in green,
 * the one in focus in burgundy, with arcs drawn from it to the rest of the network.
 * The map fills its box (sliced to fit), so phones see the heart of the region and
 * desktops the full width from the Mediterranean to the Pacific.
 */
export function NetworkMap({
  focusIndex,
  onHover,
  onSelect,
  calm = false,
}: {
  focusIndex: number;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  calm?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const slice = useSlice(box);
  const focusPoint = POINTS[focusIndex];
  const focusMarket = MARKETS[focusIndex];

  const arcs = useMemo(
    () =>
      POINTS.map((p, i) => (i === focusIndex ? null : { i, d: arcPath(focusPoint, p) })).filter(
        (a): a is { i: number; d: string } => a !== null,
      ),
    [focusIndex, focusPoint],
  );

  // Where the focused market's name sits: to its right, or to its left near the edge.
  const labelLeft = slice ? slice.ox + focusPoint.x * slice.s > slice.w - 190 : false;

  return (
    <div ref={box} className="absolute inset-0">
      {/* The countries: a static layer of its own, so the moving arcs above never make it redraw.
          Its edges dissolve into the page. */}
      <div
        className="absolute inset-0 [transform:translateZ(0)]"
        style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
      >
        <svg
          viewBox={`0 0 ${MW} ${MH}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Map of Ventrion's network across the Middle East, Central Asia and Asia."
        >
          <Countries onHover={onHover} onSelect={onSelect} />
        </svg>
      </div>

      {/* The market in focus, in burgundy, and the arcs drawn from it to the rest of the network */}
      <svg
        viewBox={`0 0 ${MW} ${MH}`}
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          d={NETWORK_PATHS[focusMarket.id]}
          fill="#b52336"
          stroke="#f4f0e6"
          strokeWidth={0.8}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <g key={focusIndex} fill="none">
          {arcs.map(({ i, d }, n) => (
            <g key={i}>
              <path
                id={`arc-${focusIndex}-${i}`}
                d={d}
                pathLength={1}
                stroke="rgb(24 67 53 / 0.5)"
                strokeWidth={1.1}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className={calm ? "" : "map-arc"}
                style={calm ? undefined : { animationDelay: `${n * 70}ms` }}
              />
              {calm ? null : (
                <circle r={2.6} fill="#b52336">
                  <animateMotion
                    dur="3.2s"
                    begin={`${0.9 + n * 0.25}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keyPoints="0;1"
                    keyTimes="0;1"
                    keySplines="0.45 0 0.25 1"
                  >
                    <mpath href={`#arc-${focusIndex}-${i}`} />
                  </animateMotion>
                </circle>
              )}
            </g>
          ))}
        </g>
      </svg>

      {/* Markers and the focused market's name, in HTML so they keep their size on every screen */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${slice ? "opacity-100" : "opacity-0"}`}>
        {slice
          ? MARKETS.map((market, i) => {
              const p = POINTS[i];
              const focused = i === focusIndex;
              return (
                <button
                  key={market.id}
                  type="button"
                  tabIndex={-1}
                  aria-label={market.name}
                  aria-pressed={focused}
                  onMouseEnter={() => onHover(i)}
                  onMouseLeave={() => onHover(null)}
                  onClick={() => onSelect(i)}
                  className="absolute -ml-3 -mt-3 flex h-6 w-6 items-center justify-center"
                  style={{ left: slice.ox + p.x * slice.s, top: slice.oy + p.y * slice.s, zIndex: focused ? 3 : 2 }}
                >
                  {focused ? (
                    <>
                      {calm ? null : <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full border border-burgundy/60 [animation-duration:2.2s]" />}
                      <span aria-hidden="true" className="relative h-3 w-3 rounded-full border-2 border-paper bg-burgundy shadow-[0_2px_8px_rgb(150_25_42/0.45)]" />
                    </>
                  ) : (
                    <span aria-hidden="true" className="h-2 w-2 rounded-full border-[1.5px] border-mark bg-paper transition-transform duration-300 hover:scale-125" />
                  )}
                </button>
              );
            })
          : null}

        {slice ? (
          <p
            key={focusIndex}
            aria-hidden="true"
            className={`map-label pointer-events-none absolute z-[4] whitespace-nowrap font-serif text-[1.15rem] italic leading-none text-ivory sm:text-[1.35rem] ${
              labelLeft ? "-translate-x-full pr-5 text-right" : "pl-5"
            }`}
            style={{ left: slice.ox + focusPoint.x * slice.s, top: slice.oy + focusPoint.y * slice.s - 30 }}
          >
            <span className="rounded-sm bg-ink/80 px-1.5 py-0.5 backdrop-blur-[2px]">{focusMarket.name}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
