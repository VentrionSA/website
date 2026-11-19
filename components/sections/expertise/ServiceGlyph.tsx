import type { JSX } from "react";
import type { ServiceGlyph as GlyphKind } from "@/lib/content";

/**
 * Minimal line diagrams that accompany each capability. Paths marked with
 * data-draw are drawn on scroll (normalised with pathLength="1").
 */

const GOLD = "#c4a779";
const IVORY = "rgba(241,239,232,0.55)";
const FAINT = "rgba(241,239,232,0.16)";

function DotGrid() {
  const dots = [];
  for (let x = 20; x <= 300; x += 20) {
    for (let y = 20; y <= 220; y += 20) dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={0.7} fill="rgba(241,239,232,0.12)" />);
  }
  return <g>{dots}</g>;
}

const common = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const };

function Research() {
  return (
    <>
      <path data-draw pathLength={1} d="M40 32 V200 H292" stroke={FAINT} strokeWidth={1} {...common} />
      <path data-draw pathLength={1} d="M52 52 C 120 70, 190 150, 284 188" stroke={GOLD} strokeWidth={1.5} {...common} />
      <path data-draw pathLength={1} d="M52 188 C 120 176, 200 104, 284 46" stroke={IVORY} strokeWidth={1.2} {...common} />
      <path d="M162 118 V200 M162 118 H40" stroke={GOLD} strokeOpacity={0.45} strokeDasharray="3 5" strokeWidth={1} {...common} />
      <circle cx={162} cy={118} r={5} fill="#101110" stroke={GOLD} strokeWidth={1.5} />
      <circle cx={162} cy={118} r={14} fill="none" stroke={GOLD} strokeOpacity={0.3} className="glyph-pulse" />
    </>
  );
}

function Connect() {
  const left = [
    [64, 60],
    [92, 98],
    [56, 140],
    [96, 176],
    [70, 206],
  ];
  const right = [
    [256, 44],
    [226, 86],
    [262, 124],
    [230, 162],
    [258, 196],
  ];
  const path = "M92 98 C 150 30, 190 40, 226 86";
  return (
    <>
      {left.map(([x, y], i) => left.slice(i + 1, i + 3).map(([x2, y2], k) => <line key={`l${i}${k}`} x1={x} y1={y} x2={x2} y2={y2} stroke={FAINT} />))}
      {right.map(([x, y], i) => right.slice(i + 1, i + 3).map(([x2, y2], k) => <line key={`r${i}${k}`} x1={x} y1={y} x2={x2} y2={y2} stroke={FAINT} />))}
      {left.map(([x, y], i) => (
        <circle key={`lc${i}`} cx={x} cy={y} r={i === 1 ? 5 : 3} fill={i === 1 ? GOLD : "#101110"} stroke={i === 1 ? GOLD : IVORY} />
      ))}
      {right.map(([x, y], i) => (
        <circle key={`rc${i}`} cx={x} cy={y} r={i === 1 ? 5 : 3} fill={i === 1 ? GOLD : "#101110"} stroke={i === 1 ? GOLD : IVORY} />
      ))}
      <path data-draw pathLength={1} d={path} stroke={GOLD} strokeWidth={1.5} {...common} />
      <path d={path} stroke={GOLD} strokeOpacity={0.6} strokeWidth={1} className="dash-flow" {...common} />
      <circle r={3.5} fill="#f1dcb2" className="glyph-travel" style={{ offsetPath: `path("${path}")` }} />
    </>
  );
}

function Negotiate() {
  return (
    <>
      <path d="M30 120 H290" stroke={FAINT} strokeDasharray="2 6" {...common} />
      <path data-draw pathLength={1} d="M32 196 C 96 190, 128 150, 160 120" stroke={IVORY} strokeWidth={1.2} {...common} />
      <path data-draw pathLength={1} d="M288 44 C 224 50, 192 90, 160 120" stroke={GOLD} strokeWidth={1.5} {...common} />
      {[52, 84, 112, 136].map((x, i) => (
        <line key={`t${i}`} x1={x} y1={196 - i * 18 - 8} x2={x} y2={196 - i * 18 + 8} stroke={IVORY} strokeOpacity={0.5} />
      ))}
      {[268, 236, 208, 184].map((x, i) => (
        <line key={`u${i}`} x1={x} y1={44 + i * 18 - 8} x2={x} y2={44 + i * 18 + 8} stroke={GOLD} strokeOpacity={0.6} />
      ))}
      <circle cx={160} cy={120} r={7} fill="#101110" stroke={GOLD} strokeWidth={1.5} />
      <circle cx={160} cy={120} r={2.5} fill={GOLD} />
      <circle cx={160} cy={120} r={20} fill="none" stroke={GOLD} strokeOpacity={0.25} className="glyph-pulse" />
    </>
  );
}

function Logistics() {
  const route = "M36 186 C 80 176, 96 140, 132 132 S 196 120, 214 92 S 258 52, 288 46";
  return (
    <>
      {[60, 120, 180, 240].map((x) => (
        <path key={x} d={`M${x} 20 C ${x - 18} 90, ${x - 18} 150, ${x} 220`} stroke={FAINT} {...common} />
      ))}
      {[70, 130, 190].map((y) => (
        <path key={y} d={`M20 ${y} C 110 ${y - 12}, 210 ${y - 12}, 300 ${y}`} stroke={FAINT} {...common} />
      ))}
      <path data-draw pathLength={1} d={route} stroke={GOLD} strokeWidth={1.5} {...common} />
      <path d={route} stroke="#f1dcb2" strokeOpacity={0.5} className="dash-flow" {...common} />
      {[
        [36, 186],
        [132, 132],
        [214, 92],
        [288, 46],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={4} fill="#101110" stroke={GOLD} strokeWidth={1.25} />
          <circle cx={x} cy={y} r={1.5} fill={GOLD} />
        </g>
      ))}
      <path d="M-5 0 L0 -5 L5 0 L0 5 Z" fill="#f1dcb2" className="glyph-travel" style={{ offsetPath: `path("${route}")` }} />
    </>
  );
}

function Finance() {
  return (
    <>
      <path d="M30 96 H290 M30 144 H290" stroke={FAINT} {...common} />
      <rect x={30} y={96} width={260} height={48} fill="rgba(196,167,121,0.05)" />
      <path
        data-draw
        pathLength={1}
        d="M30 120 L52 74 L70 150 L92 60 L112 168 L134 86 L152 176 L176 70 L196 158 L218 92 L238 150 L262 80 L290 128"
        stroke={IVORY}
        strokeOpacity={0.55}
        strokeWidth={1}
        {...common}
      />
      <path data-draw pathLength={1} d="M30 122 C 80 110, 110 132, 160 120 S 240 108, 290 118" stroke={GOLD} strokeWidth={1.75} {...common} />
      <text x={30} y={88} fill="rgba(241,239,232,0.4)" fontSize={8} letterSpacing={2} fontFamily="var(--font-sans)">
        RISK BAND
      </text>
    </>
  );
}

function Compliance() {
  const inside: [number, number][] = [];
  for (let x = 128; x <= 192; x += 16) for (let y = 88; y <= 152; y += 16) inside.push([x, y]);
  const outside: [number, number][] = [
    [46, 52],
    [70, 168],
    [92, 92],
    [38, 132],
    [262, 62],
    [282, 150],
    [244, 196],
    [226, 116],
    [64, 210],
    [272, 104],
    [100, 40],
    [214, 206],
  ];
  return (
    <>
      {outside.map(([x, y], i) => (
        <circle key={`o${i}`} cx={x} cy={y} r={2.2} fill="none" stroke={IVORY} strokeOpacity={0.35} />
      ))}
      <path data-draw pathLength={1} d="M110 90 V70 H130 M190 70 H210 V90 M210 150 V170 H190 M130 170 H110 V150" stroke={GOLD} strokeWidth={1.5} {...common} />
      {inside.map(([x, y], i) => (
        <circle key={`i${i}`} cx={x} cy={y} r={2.4} fill={GOLD} fillOpacity={0.85} />
      ))}
      <line x1={114} x2={206} y1={120} y2={120} stroke="#f1dcb2" strokeOpacity={0.7} className="glyph-scan" />
    </>
  );
}

function Intelligence() {
  return (
    <>
      {[30, 60, 90].map((r) => (
        <circle key={r} data-draw pathLength={1} cx={160} cy={120} r={r} stroke={r === 90 ? GOLD : FAINT} strokeOpacity={r === 90 ? 0.6 : 1} {...common} />
      ))}
      <path d="M60 120 H260 M160 20 V220" stroke={FAINT} {...common} />
      <g className="spin-slow" style={{ transformOrigin: "160px 120px", transformBox: "view-box", animationDuration: "9s" }}>
        <path d="M160 120 L160 30 A90 90 0 0 1 232 66 Z" fill="url(#sweep)" />
        <line x1={160} y1={120} x2={160} y2={30} stroke={GOLD} strokeWidth={1.25} />
      </g>
      {[
        [196, 74],
        [118, 160],
        [214, 150],
        [128, 86],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill={GOLD} className="glyph-blink" style={{ animationDelay: `${i * 0.7}s` }} />
      ))}
      <defs>
        <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
        </linearGradient>
      </defs>
    </>
  );
}

function Value() {
  return (
    <>
      <rect data-draw pathLength={1} x={98} y={58} width={120} height={150} stroke={FAINT} {...common} />
      <rect data-draw pathLength={1} x={86} y={46} width={120} height={150} stroke={IVORY} strokeOpacity={0.4} {...common} />
      <rect data-draw pathLength={1} x={74} y={34} width={120} height={150} {...common} fill="#141514" stroke={GOLD} strokeWidth={1.25} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line
          key={i}
          x1={90}
          x2={i === 3 ? 176 : i % 2 ? 160 : 178}
          y1={66 + i * 14}
          y2={66 + i * 14}
          stroke={i === 3 ? GOLD : IVORY}
          strokeOpacity={i === 3 ? 1 : 0.35}
          strokeWidth={i === 3 ? 1.5 : 1}
        />
      ))}
      <path data-draw pathLength={1} d="M90 166 L110 152 L128 160 L150 140 L176 148" stroke={GOLD} strokeWidth={1.25} {...common} />
      <circle cx={232} cy={150} r={22} fill="#101110" stroke={GOLD} strokeWidth={1.25} />
      <path d="M248 166 L268 186" stroke={GOLD} strokeWidth={2} {...common} />
      <path d="M222 150 H242 M232 140 V160" stroke={GOLD} strokeOpacity={0.6} {...common} />
    </>
  );
}

const GLYPHS: Record<GlyphKind, () => JSX.Element> = {
  research: Research,
  connect: Connect,
  negotiate: Negotiate,
  logistics: Logistics,
  finance: Finance,
  compliance: Compliance,
  intelligence: Intelligence,
  value: Value,
};

export function ServiceGlyph({ kind, className = "" }: { kind: GlyphKind; className?: string }) {
  const Glyph = GLYPHS[kind];
  return (
    <svg viewBox="0 0 320 240" className={className} aria-hidden="true" focusable="false">
      <DotGrid />
      <Glyph />
    </svg>
  );
}
