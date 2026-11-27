import type { CSSProperties } from "react";

/**
 * The vision, drawn in the colours of the network globe: a clear horizon with the sun
 * rising over it, light on the water, and a ship holding its course towards it. The sea
 * keeps moving, the ship rides it, and the sun climbs as the drawing scrolls into view
 * (see VisionMission.tsx).
 */

const LINE = "rgb(24 67 53 / 0.5)";
const GREEN = "#184335";
const SAGE = "#5b796c";
const FACADE = "#e3e6dd";
const BURGUNDY = "#b52336";

const W = 480;
const HORIZON = 118;
const SUN = { x: 330, r: 30 };

/** A sea line two wavelengths wider than the drawing, so it can slide one wavelength forever. */
function wave(y: number, amp: number, len: number) {
  let d = `M${-len} ${y}`;
  for (let x = -len; x < W + len; x += len) d += ` q${len / 4} ${-amp} ${len / 2} 0 t${len / 2} 0`;
  return d;
}

const WAVES = [
  { y: HORIZON + 12, amp: 1.4, len: 48, opacity: 0.42, duration: 22 },
  { y: HORIZON + 27, amp: 1.9, len: 64, opacity: 0.34, duration: 17 },
  { y: HORIZON + 44, amp: 2.4, len: 80, opacity: 0.27, duration: 13 },
  { y: HORIZON + 63, amp: 2.9, len: 96, opacity: 0.2, duration: 10 },
];

/** The sun's light on the water: bars narrowing towards the viewer. */
const GLINTS = [
  { dy: 6, w: 46 },
  { dy: 13, w: 36 },
  { dy: 20, w: 27 },
  { dy: 28, w: 19 },
  { dy: 37, w: 12 },
  { dy: 47, w: 7 },
];

export function Horizon() {
  return (
    <svg viewBox={`0 0 ${W} 200`} className="block h-auto w-full" role="img" aria-label="A ship holding its course towards the sun rising over a clear horizon.">
      <defs>
        <clipPath id="vm-sky">
          <rect x={0} y={-40} width={W} height={HORIZON + 40} />
        </clipPath>
        {/* the sea and the horizon fade out at either side, into the page */}
        <linearGradient id="vm-sea-fade" x1={0} x2={1} y1={0} y2={0}>
          <stop offset="0" stopColor="#000" />
          <stop offset="0.14" stopColor="#fff" />
          <stop offset="0.86" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id="vm-sea" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={200}>
          <rect width={W} height={200} fill="url(#vm-sea-fade)" />
        </mask>
      </defs>

      {/* the sun, rising: its rings breathe, it climbs into place as the drawing arrives */}
      <g clipPath="url(#vm-sky)">
        <g data-vm-sun>
          <g className="vm-rings">
            {[46, 62, 80].map((r, i) => (
              <circle key={r} cx={SUN.x} cy={HORIZON} r={r} fill="none" stroke={BURGUNDY} strokeOpacity={0.24 - i * 0.07} strokeWidth={0.8} />
            ))}
          </g>
          <circle cx={SUN.x} cy={HORIZON} r={SUN.r} fill={BURGUNDY} />
        </g>
      </g>

      {/* the horizon */}
      <line x1={0} y1={HORIZON} x2={W} y2={HORIZON} stroke={LINE} strokeWidth={0.9} mask="url(#vm-sea)" />

      {/* light on the water beneath the sun */}
      {GLINTS.map((g, i) => (
        <line
          key={g.dy}
          x1={SUN.x - g.w / 2}
          x2={SUN.x + g.w / 2}
          y1={HORIZON + g.dy}
          y2={HORIZON + g.dy}
          stroke={BURGUNDY}
          strokeOpacity={0.55 - i * 0.07}
          strokeWidth={1.4}
          strokeLinecap="round"
          className="vm-glint"
          style={{ animationDelay: `${(i * 0.37) % 1.6}s` }}
        />
      ))}

      {/* the sea, always moving: nearer lines move faster */}
      <g mask="url(#vm-sea)">
        {WAVES.map((w) => (
          <path
            key={w.y}
            d={wave(w.y, w.amp, w.len)}
            fill="none"
            stroke={SAGE}
            strokeOpacity={w.opacity}
            strokeWidth={0.9}
            className="vm-wave"
            style={{ "--vm-wave-length": `${w.len}px`, animationDuration: `${w.duration}s` } as CSSProperties}
          />
        ))}
      </g>

      {/* a ship on the horizon, bow to the sun: it rides the swell and makes slow headway */}
      <g className="vm-drift">
        <g transform={`translate(96 ${HORIZON})`}>
          <g className="vm-ship">
            {/* hull and boot-top */}
            <path d="M2 0 L54 0 L59 -7 L-1 -7 Z" fill={GREEN} />
            <rect x={2.5} y={-1.3} width={51} height={1.3} fill={BURGUNDY} />
            {/* hatch covers */}
            {[17, 26, 35, 44].map((x) => (
              <rect key={x} x={x} y={-9} width={6.5} height={2} fill={FACADE} stroke={GREEN} strokeWidth={0.4} />
            ))}
            {/* deck cranes */}
            <g stroke={GREEN} strokeWidth={0.7} strokeLinecap="round">
              {[24.5, 33.5, 42.5].map((x) => (
                <g key={x}>
                  <line x1={x} y1={-7} x2={x} y2={-15} />
                  <line x1={x} y1={-14} x2={x + 6} y2={-10.5} />
                </g>
              ))}
            </g>
            {/* accommodation, bridge and funnel at the stern */}
            <rect x={3} y={-17} width={10} height={10} fill={FACADE} stroke={GREEN} strokeWidth={0.6} />
            <line x1={3} y1={-13.5} x2={13} y2={-13.5} stroke={GREEN} strokeWidth={0.4} />
            <rect x={1.5} y={-18.2} width={13} height={1.2} fill={GREEN} />
            <rect x={6.5} y={-23} width={4} height={4.8} fill={GREEN} />
            <rect x={6.5} y={-21.6} width={4} height={1} fill={BURGUNDY} />
          </g>
        </g>
      </g>
    </svg>
  );
}
