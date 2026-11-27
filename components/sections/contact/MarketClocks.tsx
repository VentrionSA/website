"use client";

import { useEffect, useRef, useState } from "react";
import { useInViewport, usePrefersReducedMotion } from "@/lib/device";

/**
 * The local time across the network's markets, as on the clock walls of the old trading
 * houses: one dial per time zone, its hands in the network's colours, the seconds in
 * burgundy. None of these countries changes its clocks for summer, so each keeps a fixed
 * offset from UTC (Kazakhstan has kept one time, UTC+5, since March 2024; Indonesia is
 * shown on Western Indonesia Time).
 */
const ZONES = [
  { label: "Saudi Arabia · Qatar · Bahrain", offset: 180 },
  { label: "United Arab Emirates · Azerbaijan", offset: 240 },
  { label: "Kazakhstan", offset: 300 },
  { label: "India", offset: 330 },
  { label: "Indonesia", offset: 420 },
  { label: "China", offset: 480 },
];

const LINE = "rgb(24 67 53 / 0.5)";
const GREEN = "#184335";
const BURGUNDY = "#b52336";

function Dial({ now, offset, seconds }: { now: number | null; offset: number; seconds: boolean }) {
  const t = now === null ? null : new Date(now + offset * 60_000);
  const h = t?.getUTCHours() ?? 0;
  const m = t?.getUTCMinutes() ?? 0;
  const s = t?.getUTCSeconds() ?? 0;
  const hand = (deg: number) => ({ transform: `rotate(${deg}deg)` });

  return (
    <svg viewBox="0 0 64 64" className="block h-[3.75rem] w-[3.75rem] sm:h-16 sm:w-16" aria-hidden="true">
      <circle cx={32} cy={32} r={30} fill="#e3e6dd" stroke={LINE} strokeWidth={0.9} />
      <circle cx={32} cy={32} r={26.5} fill="#f4f0e6" stroke={LINE} strokeOpacity={0.5} strokeWidth={0.5} />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1={32}
          y1={i % 3 === 0 ? 7.5 : 8.5}
          x2={32}
          y2={i % 3 === 0 ? 12 : 10.5}
          stroke={GREEN}
          strokeOpacity={i % 3 === 0 ? 0.85 : 0.5}
          strokeWidth={i % 3 === 0 ? 1.4 : 0.9}
          transform={`rotate(${i * 30} 32 32)`}
        />
      ))}
      {t ? (
        <g strokeLinecap="round">
          <line x1={32} y1={35} x2={32} y2={18} stroke={GREEN} strokeWidth={2.2} className="clock-hand" style={hand((h % 12) * 30 + m * 0.5)} />
          <line x1={32} y1={36} x2={32} y2={11.5} stroke={GREEN} strokeWidth={1.4} className="clock-hand" style={hand(m * 6 + s * 0.1)} />
          {seconds ? (
            <line
              x1={32}
              y1={38}
              x2={32}
              y2={9.5}
              stroke={BURGUNDY}
              strokeWidth={0.8}
              className="clock-hand clock-second"
              // ticking from :59 back to :00 is a jump, not a sweep the whole way round
              style={{ ...hand(s * 6), transition: s === 0 ? "none" : undefined }}
            />
          ) : null}
        </g>
      ) : null}
      <circle cx={32} cy={32} r={1.8} fill={BURGUNDY} />
    </svg>
  );
}

export function MarketClocks() {
  const root = useRef<HTMLDivElement>(null);
  const visible = useInViewport(root, "200px 0px");
  const reduce = usePrefersReducedMotion();
  const [now, setNow] = useState<number | null>(null);

  // Tick on the second (on the minute with reduced motion), only while the clocks are on screen.
  useEffect(() => {
    setNow(Date.now());
    if (!visible) return;
    const step = reduce ? 60_000 : 1_000;
    let id = 0;
    const schedule = () => {
      id = window.setTimeout(() => {
        setNow(Date.now());
        schedule();
      }, step - (Date.now() % step) + 5);
    };
    schedule();
    return () => window.clearTimeout(id);
  }, [visible, reduce]);

  return (
    <div ref={root} className="w-full">
      <p className="eyebrow text-center text-[10px] text-mist">Local time across our markets</p>
      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-2">
        {ZONES.map((zone) => {
          const t = now === null ? null : new Date(now + zone.offset * 60_000);
          const time = t ? `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}` : "--:--";
          return (
            <li key={zone.offset} className="flex flex-col items-center text-center">
              <Dial now={now} offset={zone.offset} seconds={!reduce} />
              <p className="mt-4 font-serif text-[1.35rem] leading-none text-ivory [font-variant-numeric:lining-nums_tabular-nums]">
                <time suppressHydrationWarning>{time}</time>
              </p>
              <p className="eyebrow mt-2.5 max-w-[11rem] text-balance text-[9px] leading-[1.6] text-mist sm:text-[9.5px]">{zone.label}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
