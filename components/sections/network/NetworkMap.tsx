"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
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
/** The middle of the network: the camera leans towards it, so more of the network stays in view. */
const CENTRE = {
  x: POINTS.reduce((sum, p) => sum + p.x, 0) / POINTS.length,
  y: POINTS.reduce((sum, p) => sum + p.y, 0) / POINTS.length,
};
/** Map units per degree of longitude, around the network's latitudes. */
const UNITS_PER_DEGREE = (MW / 360) * 0.95;

/* ── The camera: a centre (map units) and a scale (pixels per map unit) ────── */

type Camera = { cx: number; cy: number; s: number };

const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));

/** The whole world, fitted to the box. */
function worldCamera(w: number, h: number): Camera {
  return { cx: MW / 2, cy: MH / 2, s: Math.min(w / MW, h / MH) };
}

/** Close in on a market: about 112 degrees of longitude across a desktop, 60 across a phone. */
function marketCamera(w: number, h: number, index: number): Camera {
  const degrees = w < 640 ? 60 : w < 1024 ? 84 : 112;
  const s = w / (degrees * UNITS_PER_DEGREE);
  const p = POINTS[index];
  const vw = w / s;
  const vh = h / s;
  return {
    cx: clamp(p.x * 0.62 + CENTRE.x * 0.38, vw / 2, MW - vw / 2),
    cy: clamp(p.y * 0.62 + CENTRE.y * 0.38, vh / 2, MH - vh / 2),
    s,
  };
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

/** The map fades out towards the edges of its band. */
const EDGE_FADE =
  "linear-gradient(90deg,transparent 0%,#000 5%,#000 95%,transparent 100%),linear-gradient(180deg,transparent 0%,#000 7%,#000 93%,transparent 100%)";

/**
 * The network on a map of the world, in the site's colours: every country in sage, the
 * markets' countries in green, the one in focus in burgundy, with arcs drawn from it to
 * the rest of the network.
 *
 * A camera frames the map. `zoomed` false shows the whole world; true closes in on the
 * market at `cameraIndex` (about a continent's width across), and the camera glides
 * whenever either changes. Markers and the market's name are positioned from the camera,
 * so they keep their size at every zoom.
 */
export function NetworkMap({
  focusIndex,
  cameraIndex,
  zoomed,
  onHover,
  onSelect,
  calm = false,
}: {
  /** Highlighted in burgundy (hover or selection). */
  focusIndex: number;
  /** The market the camera frames when zoomed (the selection; hovering never moves the map). */
  cameraIndex: number;
  zoomed: boolean;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  calm?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const landSvg = useRef<SVGSVGElement>(null);
  const focusSvg = useRef<SVGSVGElement>(null);
  const markerEls = useRef<(HTMLButtonElement | null)[]>([]);
  const labelEl = useRef<HTMLDivElement>(null);
  const camera = useRef<Camera | null>(null);
  const size = useRef({ w: 0, h: 0 });
  const view = useRef({ zoomed, cameraIndex, focusIndex });
  const tween = useRef<gsap.core.Tween | null>(null);
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
      const p = POINTS[view.current.focusIndex];
      const x = (p.x - vx) * cam.s;
      label.style.transform = `translate3d(${x.toFixed(1)}px,${((p.y - vy) * cam.s).toFixed(1)}px,0)`;
      label.dataset.side = x > w - 190 ? "left" : "right";
    }
  }, []);

  const target = useCallback((w: number, h: number) => {
    const { zoomed: z, cameraIndex: c } = view.current;
    return z ? marketCamera(w, h, c) : worldCamera(w, h);
  }, []);

  // Measure the box; on every resize, snap to the current view.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      size.current = { w: width, h: height };
      tween.current?.kill();
      camera.current = target(width, height);
      setDot(3.2 / marketCamera(width, height, 0).s);
      apply();
      setReady(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [apply, target]);

  // The market's name follows the focus.
  useLayoutEffect(() => {
    view.current.focusIndex = focusIndex;
    apply();
  }, [focusIndex, apply]);

  // Glide to the new view when the zoom or the selected market changes.
  useEffect(() => {
    view.current.zoomed = zoomed;
    view.current.cameraIndex = cameraIndex;
    const from = camera.current;
    const { w, h } = size.current;
    if (!from || !w || !h) return;
    const to = target(w, h);
    tween.current?.kill();
    if (calm) {
      camera.current = to;
      apply();
      return;
    }
    // Zoom on a logarithmic scale so it feels even; glide the centre alongside.
    const ls0 = Math.log(from.s);
    const ls1 = Math.log(to.s);
    const zooming = Math.abs(ls1 - ls0) > 0.4;
    const state = { t: 0 };
    tween.current = gsap.to(state, {
      t: 1,
      duration: zooming ? 2.6 : 1.7,
      ease: zooming ? "power2.inOut" : "power3.inOut",
      onUpdate: () => {
        const t = state.t;
        camera.current = {
          cx: from.cx + (to.cx - from.cx) * t,
          cy: from.cy + (to.cy - from.cy) * t,
          s: Math.exp(ls0 + (ls1 - ls0) * t),
        };
        apply();
      },
    });
  }, [zoomed, cameraIndex, calm, apply, target]);

  useEffect(() => () => void tween.current?.kill(), []);

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
