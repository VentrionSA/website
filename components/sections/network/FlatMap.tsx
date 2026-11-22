"use client";

import { useEffect, useMemo, useRef } from "react";
import countryData from "@/lib/geo/countries.json";
import { MARKETS } from "@/lib/content";

type CountryData = { w: number; h: number; countries: { id: string | null; d: string }[] };

// Crop of the equirectangular world focused on the network.
const VIEW = { lonMin: 14, lonMax: 146, latMin: -24, latMax: 62 };
const W = VIEW.lonMax - VIEW.lonMin;
const H = VIEW.latMax - VIEW.latMin;

function project(lat: number, lon: number) {
  return { x: ((lon - VIEW.lonMin) / W) * 100, y: ((VIEW.latMax - lat) / H) * 100 };
}

/**
 * Static 2D map used when WebGL is unavailable: the same country outlines as the
 * globe, with the network in burgundy. Markers remain interactive.
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
  const paths = useMemo(
    () =>
      (countryData as CountryData).countries.map((c) => ({
        index: c.id ? MARKETS.findIndex((m) => m.id === c.id) : -1,
        path: new Path2D(c.d),
      })),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = countryData as CountryData;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // map data space: x = (lon + 180) / 360 * w, y = (90 - lat) / 180 * h
      const x0 = ((VIEW.lonMin + 180) / 360) * data.w;
      const x1 = ((VIEW.lonMax + 180) / 360) * data.w;
      const y0 = ((90 - VIEW.latMax) / 180) * data.h;
      const y1 = ((90 - VIEW.latMin) / 180) * data.h;
      const sx = canvas.width / (x1 - x0);
      const sy = canvas.height / (y1 - y0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(sx, 0, 0, sy, -x0 * sx, -y0 * sy);
      for (const { index, path } of paths) {
        ctx.fillStyle = "#c9d1c5";
        ctx.fill(path);
        if (index >= 0) {
          ctx.fillStyle = index === focusIndex ? "#b52336" : "rgba(181,35,54,0.62)";
          ctx.fill(path);
        }
      }
      ctx.lineJoin = "round";
      ctx.lineWidth = dpr / sx;
      ctx.strokeStyle = "rgba(24,67,53,0.38)";
      for (const { path } of paths) ctx.stroke(path);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [paths, focusIndex]);

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
              <span
                className={`block rounded-full border-2 border-burgundy bg-paper transition-transform duration-300 ${focused ? "h-3.5 w-3.5" : "h-2.5 w-2.5"}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
