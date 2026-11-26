"use client";

import { memo, useCallback, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type Ref } from "react";
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

/* ── The camera: a centre (map units) and a scale (pixels per map unit) ────── */

type Camera = { cx: number; cy: number; s: number };
type Box = { x0: number; y0: number; x1: number; y1: number };
type Bounds = { west: number; east: number; south: number; north: number };

/** The map units a stretch of the globe covers (its edges sampled, as the meridians curve). */
function boxOf({ west, east, south, north }: Bounds): Box {
  const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const add = (lat: number, lon: number) => {
    const p = project(lat, lon);
    box.x0 = Math.min(box.x0, p.x);
    box.x1 = Math.max(box.x1, p.x);
    box.y0 = Math.min(box.y0, p.y);
    box.y1 = Math.max(box.y1, p.y);
  };
  for (let lat = south; lat <= north; lat += 1) {
    add(lat, west);
    add(lat, east);
  }
  for (let lon = west; lon <= east; lon += 2) {
    add(south, lon);
    add(north, lon);
  }
  return box;
}

/** Frames a box in the part of the stage below the fixed header (`inset` pixels tall). */
function fit(box: Box, w: number, h: number, inset: number, margin: number): Camera {
  const area = h - inset;
  const s = Math.min(w / ((box.x1 - box.x0) * (1 + 2 * margin)), area / ((box.y1 - box.y0) * (1 + 2 * margin)));
  return { cx: (box.x0 + box.x1) / 2, cy: (box.y0 + box.y1) / 2 - inset / (2 * s), s };
}

const WORLD: Box = { x0: 0, y0: 0, x1: MW, y1: MH };
/** The network, on screens wide enough to hold all of it: the Red Sea to Indonesia, Kazakhstan to Java. */
const NETWORK = boxOf({ west: 28, east: 146, south: -12, north: 57 });
/** Phones: the Gulf and Central Asia first, then the camera travels east to China and Indonesia. */
const NETWORK_WEST = boxOf({ west: 34, east: 90, south: -6, north: 56 });
const NETWORK_EAST = boxOf({ west: 76, east: 134, south: -10, north: 54 });

type Key = { at: number; cam: Camera };

/** The scroll's camera path: the whole world, then the network (on phones, west then east). */
function cameraPath(w: number, h: number, inset: number): Key[] {
  const world = fit(WORLD, w, h, inset, 0.02);
  if (w >= 640) {
    return [
      { at: 0.1, cam: world },
      { at: 0.68, cam: fit(NETWORK, w, h, inset, 0.03) },
    ];
  }
  return [
    { at: 0.08, cam: world },
    { at: 0.5, cam: fit(NETWORK_WEST, w, h, inset, 0.02) },
    { at: 0.86, cam: fit(NETWORK_EAST, w, h, inset, 0.02) },
  ];
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** The camera at a point along the path: zoom on a logarithmic scale so it feels even. */
function cameraAt(path: Key[], progress: number): Camera {
  if (progress <= path[0].at) return path[0].cam;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (progress <= b.at) {
      const t = easeInOut((progress - a.at) / (b.at - a.at));
      return {
        cx: a.cam.cx + (b.cam.cx - a.cam.cx) * t,
        cy: a.cam.cy + (b.cam.cy - a.cam.cy) * t,
        s: Math.exp(Math.log(a.cam.s) + (Math.log(b.cam.s) - Math.log(a.cam.s)) * t),
      };
    }
  }
  return path[path.length - 1].cam;
}

/** A gentle arc between two markets, bowed to the north like a flight path. */
function arcPath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${mx.toFixed(1)},${(my - dist * 0.28).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}

/** The countries and the graticule: drawn once, never re-rendered as the focus moves. */
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
      for (let lat = latMin; lat <= latMax; lat += 2) {
        const p = project(lat, lon);
        pts.push(`${p.x.toFixed(0)},${p.y.toFixed(0)}`);
      }
      const end = project(latMax, lon);
      pts.push(`${end.x.toFixed(0)},${end.y.toFixed(0)}`);
      return `M${pts.join("L")}`;
    };
    const lines: string[] = [];
    for (let lon = -165; lon <= 165; lon += 15) lines.push(meridian(lon));
    for (let lat = -45; lat <= 75; lat += 15) {
      const a = project(lat, -180);
      const b = project(lat, 180);
      lines.push(`M${a.x.toFixed(0)},${a.y.toFixed(0)}H${b.x.toFixed(0)}`);
    }
    return { graticule: lines.join(""), outline: meridian(-180) + meridian(180) };
  }, []);

  return (
    <>
      <path d={graticule} fill="none" stroke="rgb(24 67 53 / 0.07)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <path d={outline} fill="none" stroke="rgb(24 67 53 / 0.16)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <path d={LAND_PATH} fill="#d9ddd2" stroke="#f4f0e6" strokeWidth={0.8} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {MARKETS.map((market, i) => (
        <path
          key={market.id}
          d={NETWORK_PATHS[market.id]}
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
    </>
  );
});

/** The map fades out towards the edges of the stage. */
const EDGE_FADE =
  "linear-gradient(90deg,transparent 0%,#000 4%,#000 96%,transparent 100%),linear-gradient(180deg,transparent 0%,#000 7%,#000 93%,transparent 100%)";

export type NetworkMapHandle = {
  /** Where the scroll is along the camera's path: 0 the whole world, 1 the network. */
  setProgress: (progress: number) => void;
  /** Whether a market's marker is on screen, clear of the header and the caption. */
  shows: (index: number) => boolean;
};

/**
 * The network on a map of the world, in the site's colours: every country in sage, the
 * markets' countries in green, the one in focus in burgundy, with arcs drawn from it to
 * the rest of the network.
 *
 * The page's scroll drives a camera through it (`setProgress`): it opens on the whole
 * world and closes in on the network. Only the SVG viewBox changes as it moves, and the
 * markers and the market's name are placed directly, so nothing re-renders while it does.
 */
export function NetworkMap({
  ref,
  focusIndex,
  onHover,
  onSelect,
  calm = false,
  still = false,
  topInset = 0,
}: {
  ref?: Ref<NetworkMapHandle>;
  /** Highlighted in burgundy (hover or selection). */
  focusIndex: number;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  /** Reduced motion: no ping, no travelling lights. */
  calm?: boolean;
  /** Not driven by the scroll: framed on the whole network. */
  still?: boolean;
  /** Height of the fixed header over the top of the map, kept clear when framing. */
  topInset?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const landSvg = useRef<SVGSVGElement>(null);
  const focusSvg = useRef<SVGSVGElement>(null);
  const markerEls = useRef<(HTMLButtonElement | null)[]>([]);
  const labelEl = useRef<HTMLDivElement>(null);
  const camera = useRef<Camera | null>(null);
  const path = useRef<Key[] | null>(null);
  const progress = useRef(0);
  const size = useRef({ w: 0, h: 0 });
  const focusRef = useRef(focusIndex);
  const stillRef = useRef(still);
  const [ready, setReady] = useState(false);
  const [dot, setDot] = useState(14);

  const focusPoint = POINTS[focusIndex];
  const focusMarket = MARKETS[focusIndex];

  /** Frames the map from the camera: both layers' viewBox, then the markers and the label. */
  const apply = useCallback(() => {
    const cam = camera.current;
    const { w, h } = size.current;
    if (!cam || !w || !h) return;
    const vw = w / cam.s;
    const vh = h / cam.s;
    const vx = cam.cx - vw / 2;
    const vy = cam.cy - vh / 2;
    const viewBox = `${vx.toFixed(2)} ${vy.toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}`;
    landSvg.current?.setAttribute("viewBox", viewBox);
    focusSvg.current?.setAttribute("viewBox", viewBox);
    POINTS.forEach((p, i) => {
      const el = markerEls.current[i];
      if (el) el.style.transform = `translate3d(${((p.x - vx) * cam.s).toFixed(1)}px,${((p.y - vy) * cam.s).toFixed(1)}px,0)`;
    });
    const label = labelEl.current;
    if (label) {
      const p = POINTS[focusRef.current];
      const x = (p.x - vx) * cam.s;
      label.style.transform = `translate3d(${x.toFixed(1)}px,${((p.y - vy) * cam.s).toFixed(1)}px,0)`;
      label.dataset.side = x > w - 190 ? "left" : "right";
    }
  }, []);

  const frame = useCallback(() => {
    const { w, h } = size.current;
    if (!w || !h) return;
    if (stillRef.current) camera.current = fit(w >= 640 ? NETWORK : NETWORK_WEST, w, h, topInset, 0.03);
    else if (path.current) camera.current = cameraAt(path.current, progress.current);
    apply();
  }, [apply, topInset]);

  useImperativeHandle(
    ref,
    () => ({
      setProgress(p: number) {
        progress.current = Math.min(1, Math.max(0, p));
        frame();
      },
      shows(index: number) {
        const cam = camera.current;
        const { w, h } = size.current;
        if (!cam || !w || !h) return true;
        const p = POINTS[index];
        const x = (p.x - cam.cx) * cam.s + w / 2;
        const y = (p.y - cam.cy) * cam.s + h / 2;
        return x > 24 && x < w - 24 && y > topInset + 24 && y < h - 64;
      },
    }),
    [frame, topInset],
  );

  // Measure the stage; on every resize, rebuild the camera's path and reframe.
  useLayoutEffect(() => {
    stillRef.current = still;
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      size.current = { w: width, h: height };
      path.current = cameraPath(width, height, topInset);
      const close = width >= 640 ? fit(NETWORK, width, height, topInset, 0.03) : fit(NETWORK_WEST, width, height, topInset, 0.02);
      setDot(3.4 / close.s);
      frame();
      setReady(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [frame, still, topInset]);

  // The market's name follows the focus.
  useLayoutEffect(() => {
    focusRef.current = focusIndex;
    apply();
  }, [focusIndex, apply]);

  const arcs = useMemo(
    () =>
      POINTS.map((p, i) => (i === focusIndex ? null : { i, d: arcPath(focusPoint, p) })).filter(
        (a): a is { i: number; d: string } => a !== null,
      ),
    [focusIndex, focusPoint],
  );

  return (
    <div ref={box} className="absolute inset-0 overflow-hidden">
      {/* Both map layers share one edge fade */}
      <div
        className="absolute inset-0"
        style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
      >
        <svg
          ref={landSvg}
          viewBox={`0 0 ${MW} ${MH}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="World map of Ventrion's network, across the Middle East, Central Asia and Asia."
        >
          <Countries onHover={onHover} onSelect={onSelect} />
        </svg>

        {/* The market in focus, in burgundy, and the arcs drawn from it to the rest of the network */}
        <svg
          ref={focusSvg}
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
                  <circle r={dot} fill="#b52336">
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
      </div>

      {/* Markers and the focused market's name, in HTML so they keep their size at every zoom */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
        {MARKETS.map((market, i) => {
          const focused = i === focusIndex;
          return (
            <button
              key={market.id}
              ref={(el) => {
                markerEls.current[i] = el;
              }}
              type="button"
              tabIndex={-1}
              aria-label={market.name}
              aria-pressed={focused}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(i)}
              className="absolute left-0 top-0 -ml-3 -mt-3 flex h-6 w-6 items-center justify-center will-change-transform"
              style={{ zIndex: focused ? 3 : 2 }}
            >
              {focused ? (
                <>
                  {calm ? null : (
                    <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full border border-burgundy/60 [animation-duration:2.2s]" />
                  )}
                  <span
                    aria-hidden="true"
                    className="relative h-3 w-3 rounded-full border-2 border-paper bg-burgundy shadow-[0_2px_8px_rgb(150_25_42/0.45)]"
                  />
                </>
              ) : (
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full border-[1.5px] border-mark bg-paper transition-transform duration-300 hover:scale-150"
                />
              )}
            </button>
          );
        })}

        <div ref={labelEl} aria-hidden="true" className="group pointer-events-none absolute left-0 top-0 z-[4] will-change-transform">
          <p
            key={focusIndex}
            className="map-label -translate-y-full whitespace-nowrap pb-2 pl-3 font-serif text-[1.05rem] italic leading-none text-ivory group-data-[side=left]:-translate-x-full group-data-[side=left]:pl-0 group-data-[side=left]:pr-3 sm:pl-4 sm:text-[1.3rem] sm:group-data-[side=left]:pr-4"
          >
            <span className="rounded-sm bg-ink/80 px-1.5 py-0.5 backdrop-blur-[2px]">{focusMarket.name}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
