"use client";

import { useEffect, useMemo, useRef } from "react";
import { decodeLandPoints } from "@/lib/geo/points";
import { MARKETS } from "@/lib/content";

// Crop of the equirectangular world focused on the network.
const VIEW = { lonMin: 14, lonMax: 146, latMin: -24, latMax: 62 };
const W = VIEW.lonMax - VIEW.lonMin;
const H = VIEW.latMax - VIEW.latMin;

function project(lat: number, lon: number) {
  return { x: ((lon - VIEW.lonMin) / W) * 100, y: ((VIEW.latMax - lat) / H) * 100 };
}

/**
 * Static 2D dotted map used when WebGL is unavailable or reduced motion is
 * requested. Markers remain fully interactive and keyboard accessible.
 */
export function FlatMap({
  focusIndex,
  onHover,
  onSelect,
}: {
  focusIndex: number;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useMemo(() => decodeLandPoints().filter((p) => p.lon >= VIEW.lonMin && p.lon <= VIEW.lonMax && p.lat >= VIEW.latMin && p.lat <= VIEW.latMax), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const r = Math.max(1, rect.width / 520) * dpr;
      for (const p of points) {
        const { x, y } = project(p.lat, p.lon);
        const focus = p.country === focusIndex;
        ctx.fillStyle = focus ? "rgba(181,35,54,1)" : p.country >= 0 ? "rgba(181,35,54,0.78)" : "rgba(28,25,20,0.3)";
        ctx.beginPath();
        ctx.arc((x / 100) * canvas.width, (y / 100) * canvas.height, focus ? r * 1.3 : r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [points, focusIndex]);

  return (
    <div className="absolute inset-0 flex items-center">
      <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        {MARKETS.map((m, i) => {
          const { x, y } = project(m.lat, m.lon);
          const focused = i === focusIndex;
          return (
            <button
              key={m.id}
              type="button"
              aria-label={m.name}
              aria-pressed={focused}
              tabIndex={-1}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(i)}
              className="absolute -translate-x-1/2 -translate-y-1/2 p-2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span className={`block rounded-full border border-gold ${focused ? "h-4 w-4 bg-gold-soft" : "h-2.5 w-2.5 bg-gold"}`} />
              {focused ? (
                <span className="eyebrow absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap bg-ink/85 px-3 py-1.5 text-[10px] text-gold">
                  {m.name}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
