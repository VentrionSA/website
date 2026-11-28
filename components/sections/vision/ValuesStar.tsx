import { MARK_PATH } from "@/components/brand/logo-paths";

/**
 * The values, drawn in the colours of the network globe: the Ventrion star with one
 * value at each of its four points, Trust at the top. A fine ring turns slowly around
 * it and the four points light in turn. The star itself is always upright.
 */

const LINE = "rgb(24 67 53 / 0.5)";
const GREEN = "#184335";
const BURGUNDY = "#b52336";

const C = { x: 240, y: 100 };
const RING = 66;
const STAR = 104;
const STAR_SCALE = STAR / 767;

const POINTS = [
  { label: "Trust", x: C.x, y: C.y - RING, tx: C.x, ty: C.y - RING - 14, anchor: "middle" },
  { label: "Transparency", x: C.x + RING, y: C.y, tx: C.x + RING + 14, ty: C.y + 4.5, anchor: "start" },
  { label: "Accountability", x: C.x, y: C.y + RING, tx: C.x, ty: C.y + RING + 24, anchor: "middle" },
  { label: "Discretion", x: C.x - RING, y: C.y, tx: C.x - RING - 14, ty: C.y + 4.5, anchor: "end" },
] as const;

export function ValuesStar() {
  return (
    <svg viewBox="0 0 480 200" className="block h-auto w-full overflow-visible" role="img" aria-label="The Ventrion star, with a value at each of its four points: trust, transparency, accountability and discretion.">
      {/* the ring, turning slowly */}
      <g className="values-ring">
        <circle cx={C.x} cy={C.y} r={RING} fill="none" stroke={LINE} strokeWidth={0.9} strokeDasharray="2 5" />
      </g>
      <circle cx={C.x} cy={C.y} r={RING - 8} fill="#e3e6dd" fillOpacity={0.45} stroke={LINE} strokeOpacity={0.5} strokeWidth={0.6} />

      {/* the star, upright */}
      <path
        d={MARK_PATH}
        fillRule="evenodd"
        fill={GREEN}
        transform={`translate(${C.x - (759 * STAR_SCALE) / 2} ${C.y - (767 * STAR_SCALE) / 2}) scale(${STAR_SCALE})`}
      />

      {/* the four values, one at each point, lighting in turn */}
      {POINTS.map((p, i) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r={10} fill="none" stroke={BURGUNDY} strokeOpacity={0.45} strokeWidth={0.9} className="values-pulse" style={{ animationDelay: `${i * 0.9}s` }} />
          <circle cx={p.x} cy={p.y} r={4.5} fill={BURGUNDY} stroke="#f4f0e6" strokeWidth={1.8} />
          <text
            x={p.tx}
            y={p.ty}
            textAnchor={p.anchor}
            className="font-sans"
            fontSize={12.5}
            fontWeight={600}
            letterSpacing="0.16em"
            fill={GREEN}
            fillOpacity={0.85}
          >
            {p.label.toUpperCase()}
          </text>
        </g>
      ))}
    </svg>
  );
}
