"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { MARKETS } from "@/lib/content";
import { LAND_PATH, MAP_PROJECTION, MAP_SIZE, NETWORK_PATHS } from "@/lib/geo/network-map";

const { width: MW, height: MH } = MAP_SIZE;

/* Equal Earth (Šavrič, Patterson & Jenny, 2018): the projection the outlines were built with. */
const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;

/** Latitude and longitude to map units. */
function project(lat: number, lon: number) {
  const lambda = (lon * Math.PI) / 180;
  const theta = Math.asin(M * Math.sin((lat * Math.PI) / 180));
  const t2 = theta * theta;
  const t6 = t2 * t2 * t2;
  const x = (2 * Math.sqrt(3) * lambda * Math.cos(theta)) / (3 * (9 * A4 * t6 * t2 + 7 * A3 * t6 + 3 * A2 * t2 + A1));
  const y = theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  const { scale, xMax, yTop } = MAP_PROJECTION;
  return { x: scale * (x + xMax), y: scale * (yTop - y) };
}

const POINTS = MARKETS.map((m) => project(m.lat, m.lon));

/** A light fade at the top and bottom edges, where the map is cropped (the Arctic, the Southern Ocean). */
const EDGE_FADE = "linear-gradient(180deg,transparent 0%,#000 4%,#000 96%,transparent 100%)";

/** A gentle arc between two markets, bowed to the north like a flight path. */
function arcPath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${mx.toFixed(1)},${(my - dist * 0.28).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}

/** How the map (the whole viewBox, fitted) sits in its box: used to place the HTML markers over it. */
function useSlice(ref: React.RefObject<HTMLDivElement | null>) {
  const [slice, setSlice] = useState<{ s: number; ox: number; oy: number; w: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      const s = Math.min(width / MW, height / MH);
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
  const { graticule, outline } = useMemo(() => {
    const { latMin, latMax } = MAP_PROJECTION;
    const meridian = (lon: number) => {
      const pts: string[] = [];
      for (let lat = latMin; lat <= latMax; lat += 3) {
        const p = project(lat, lon);
        pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      }
      const end = project(latMax, lon);
      pts.push(`${end.x.toFixed(1)},${end.y.toFixed(1)}`);
      return `M${pts.join("L")}`;
    };
    const lines: string[] = [];
    for (let lon = -150; lon <= 150; lon += 30) lines.push(meridian(lon));
    for (const lat of [-30, 0, 30, 60]) {
      const a = project(lat, -180);
      const b = project(lat, 180);
      lines.push(`M${a.x.toFixed(1)},${a.y.toFixed(1)}H${b.x.toFixed(1)}`);
    }
    return { graticule: lines.join(""), outline: meridian(-180) + meridian(180) };
  }, []);

  return (
    <>
      <path d={graticule} fill="none" stroke="rgb(24 67 53 / 0.07)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <path d={outline} fill="none" stroke="rgb(24 67 53 / 0.16)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
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
 * The network on a map of the whole world, in the site's colours: every country in
 * sage, the markets' countries in green, the one in focus in burgundy, with arcs drawn
 * from it to the rest of the network. The whole world is always in view.
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
  const labelLeft = slice ? slice.ox + focusPoint.x * slice.s > slice.w - 170 : false;

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
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="World map of Ventrion's network, across the Middle East, Central Asia and Asia."
        >
          <Countries onHover={onHover} onSelect={onSelect} />
        </svg>
      </div>

      {/* The market in focus, in burgundy, and the arcs drawn from it to the rest of the network */}
      <svg
        viewBox={`0 0 ${MW} ${MH}`}
        preserveAspectRatio="xMidYMid meet"
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
                <circle r={3.2} fill="#b52336">
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
                      <span aria-hidden="true" className="relative h-2.5 w-2.5 rounded-full border-2 border-paper bg-burgundy shadow-[0_2px_8px_rgb(150_25_42/0.45)] sm:h-3 sm:w-3" />
                    </>
                  ) : (
                    <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full border border-mark bg-paper transition-transform duration-300 hover:scale-150" />
                  )}
                </button>
              );
            })
          : null}

        {slice ? (
          <p
            key={focusIndex}
            aria-hidden="true"
            className={`map-label pointer-events-none absolute z-[4] -translate-y-full whitespace-nowrap font-serif text-[0.95rem] italic leading-none text-ivory sm:text-[1.25rem] ${
              labelLeft ? "-translate-x-full pr-3 text-right sm:pr-4" : "pl-3 sm:pl-4"
            }`}
            style={{ left: slice.ox + focusPoint.x * slice.s, top: slice.oy + focusPoint.y * slice.s - 8 }}
          >
            <span className="rounded-sm bg-ink/80 px-1.5 py-0.5 backdrop-blur-[2px]">{focusMarket.name}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
