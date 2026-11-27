"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";

/**
 * A portolan chart, the sea chart of the old trading routes, drawn behind the closing
 * statement: rhumb lines in every direction from the Ventrion star, and from a circle of
 * sixteen roses around it. As on the old charts, the eight winds are drawn in the darkest
 * ink, the half winds in green and the quarter winds in red, here the site's own green and
 * burgundy. The web opens out from the star as the section scrolls into view, and light
 * keeps travelling along the routes in towards the star: the world, brought to Ventrion's
 * clients.
 */

const GREEN = "#184335";
const SAGE = "#5b796c";
const BURGUNDY = "#b52336";
const DIRECTIONS = 32;
const ROSES = 16;

type Point = { x: number; y: number };

export function Portolan({ hub }: { hub: RefObject<HTMLElement | null> }) {
  const box = useRef<HTMLDivElement>(null);
  const reveal = useRef<SVGRadialGradientElement>(null);
  const [frame, setFrame] = useState<{ w: number; h: number; c: Point } | null>(null);
  const [live, setLive] = useState(false);

  // Measure the section and where the star sits in it; again whenever either moves. (After
  // the commit, not during it: the star comes later in the page, so its ref is set last.)
  useEffect(() => {
    const el = box.current;
    const star = hub.current;
    if (!el || !star) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const s = star.getBoundingClientRect();
      if (!r.width || !r.height) return;
      setFrame({ w: r.width, h: r.height, c: { x: s.left + s.width / 2 - r.left, y: s.top + s.height / 2 - r.top } });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (star.parentElement) ro.observe(star.parentElement);
    return () => ro.disconnect();
  }, [hub]);

  // The travelling light runs only while the chart is on screen.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const chart = useMemo(() => {
    if (!frame) return null;
    const { w, h, c } = frame;
    const radius = Math.max(w, h) * 0.44;
    const reach = Math.hypot(w, h) * 1.6;
    const roses: Point[] = Array.from({ length: ROSES }, (_, j) => {
      const a = (j * 2 * Math.PI) / ROSES;
      return { x: c.x + radius * Math.sin(a), y: c.y - radius * Math.cos(a) };
    });
    const lines = { winds: "", half: "", quarter: "" };
    for (const p of [c, ...roses]) {
      for (let k = 0; k < DIRECTIONS; k++) {
        const a = (k * 2 * Math.PI) / DIRECTIONS;
        const seg = `M${p.x.toFixed(1)} ${p.y.toFixed(1)}L${(p.x + reach * Math.sin(a)).toFixed(1)} ${(p.y - reach * Math.cos(a)).toFixed(1)}`;
        if (k % 4 === 0) lines.winds += seg;
        else if (k % 2 === 0) lines.half += seg;
        else lines.quarter += seg;
      }
    }
    return { w, h, c, radius, reach, roses, lines };
  }, [frame]);

  // The web opens out from the star as the section arrives.
  useGSAP(
    () => {
      if (!chart || !reveal.current) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        gsap.fromTo(
          reveal.current,
          { attr: { r: 1 } },
          {
            attr: { r: chart.reach },
            ease: "none",
            scrollTrigger: { trigger: box.current, start: "top 85%", end: "center 45%", scrub: 0.8 },
          },
        );
      });
    },
    { scope: box, dependencies: [chart], revertOnUpdate: true },
  );

  return (
    <div ref={box} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {chart ? (
        <svg width={chart.w} height={chart.h} viewBox={`0 0 ${chart.w} ${chart.h}`} className={`absolute inset-0 ${live ? "is-live" : ""}`}>
          <defs>
            <radialGradient ref={reveal} id="portolan-reveal" gradientUnits="userSpaceOnUse" cx={chart.c.x} cy={chart.c.y} r={chart.reach}>
              <stop offset="0.82" stopColor="#fff" />
              <stop offset="1" stopColor="#000" />
            </radialGradient>
            <mask id="portolan-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={chart.w} height={chart.h}>
              <rect width={chart.w} height={chart.h} fill="url(#portolan-reveal)" />
            </mask>
          </defs>

          <g mask="url(#portolan-mask)" fill="none" strokeLinecap="round">
            <path d={chart.lines.quarter} stroke={BURGUNDY} strokeOpacity={0.1} strokeWidth={0.6} />
            <path d={chart.lines.half} stroke={SAGE} strokeOpacity={0.17} strokeWidth={0.7} />
            <path d={chart.lines.winds} stroke={GREEN} strokeOpacity={0.17} strokeWidth={0.8} />
            {/* the circle of roses */}
            <circle cx={chart.c.x} cy={chart.c.y} r={chart.radius} stroke={GREEN} strokeOpacity={0.22} strokeWidth={0.8} />

            {/* light travelling in along the routes, from every rose to the star */}
            {chart.roses.map((p, j) => (
              <line
                key={j}
                x1={p.x}
                y1={p.y}
                x2={chart.c.x}
                y2={chart.c.y}
                pathLength={1}
                stroke={j % 2 ? BURGUNDY : GREEN}
                strokeOpacity={j % 2 ? 0.75 : 0.55}
                strokeWidth={1.6}
                className="portolan-pulse"
                style={{ animationDelay: `${-((j * 7) % ROSES) * 0.41}s` }}
              />
            ))}

            {/* the roses: each a small compass star */}
            {chart.roses.map((p, j) => (
              <g key={j} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
                <circle r={8} fill="#f4f0e6" stroke={GREEN} strokeOpacity={0.45} strokeWidth={0.8} />
                <path d="M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z" fill={j % 4 === 0 ? BURGUNDY : GREEN} fillOpacity={0.75} />
              </g>
            ))}
          </g>

          {/* a graduated ring turning slowly around the star */}
          <g transform={`translate(${chart.c.x.toFixed(1)} ${chart.c.y.toFixed(1)})`}>
            <g className="portolan-ring">
              <circle r={chart.w < 640 ? 46 : 58} fill="none" stroke={GREEN} strokeOpacity={0.35} strokeWidth={0.8} strokeDasharray="1 5" />
              <circle r={chart.w < 640 ? 54 : 68} fill="none" stroke={GREEN} strokeOpacity={0.18} strokeWidth={0.8} />
            </g>
          </g>
        </svg>
      ) : null}
    </div>
  );
}
