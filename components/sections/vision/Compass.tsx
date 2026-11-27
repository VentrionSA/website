import { MARK_PATH } from "@/components/brand/logo-paths";

/**
 * The mission, drawn in the colours of the network globe: a compass whose rose is the
 * Ventrion star, with a course laid off it to the east-north-east, towards a destination
 * marked in burgundy. The course swings in and settles as the drawing scrolls into view
 * (see VisionMission.tsx), then holds, with the faint sway of a real compass.
 */

const LINE = "rgb(24 67 53 / 0.5)";
const GREEN = "#184335";
const BURGUNDY = "#b52336";

const C = { x: 150, y: 104 };
const RING = 68;
const INNER = 60;
/** The course, in degrees clockwise from north. */
export const COURSE = 72;
const REACH = 280;
/** The star's own drawing is 759 x 767; it is set upright, as the logo always is. */
const STAR = 96;
const STAR_SCALE = STAR / 767;

const ticks = Array.from({ length: 72 }, (_, i) => i * 5);

function polar(deg: number, r: number) {
  const a = (deg * Math.PI) / 180;
  return { x: C.x + r * Math.sin(a), y: C.y - r * Math.cos(a) };
}

export function Compass() {
  return (
    <svg viewBox="0 0 480 200" className="block h-auto w-full overflow-visible" role="img" aria-label="A compass whose rose is the Ventrion star, with a steady course laid to the east-north-east.">
      {/* the dial */}
      <circle cx={C.x} cy={C.y} r={RING} fill="#e3e6dd" fillOpacity={0.55} stroke={LINE} strokeWidth={0.9} />
      <circle cx={C.x} cy={C.y} r={INNER} fill="none" stroke={LINE} strokeOpacity={0.6} strokeWidth={0.6} />
      <g stroke={LINE} strokeLinecap="round">
        {ticks.map((deg) => {
          const major = deg % 45 === 0;
          const a = polar(deg, INNER);
          const b = polar(deg, major ? RING : INNER + 4);
          return <line key={deg} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={major ? 1 : 0.6} />;
        })}
      </g>
      <g className="font-serif" fill={GREEN} fillOpacity={0.75} fontSize={12} textAnchor="middle">
        <text x={C.x} y={C.y - RING - 8}>N</text>
        <text x={C.x + RING + 11} y={C.y + 4}>E</text>
        <text x={C.x} y={C.y + RING + 16}>S</text>
        <text x={C.x - RING - 11} y={C.y + 4}>W</text>
      </g>

      {/* the rose: the Ventrion star */}
      <path
        d={MARK_PATH}
        fillRule="evenodd"
        fill={GREEN}
        transform={`translate(${C.x - (759 * STAR_SCALE) / 2} ${C.y - (767 * STAR_SCALE) / 2}) scale(${STAR_SCALE})`}
      />

      {/* the course: drawn pointing north, turned to its heading */}
      <g data-vm-course transform={`rotate(${COURSE} ${C.x} ${C.y})`}>
        <g className="vm-sway">
          <line x1={C.x} y1={C.y - RING - 15} x2={C.x} y2={C.y - REACH + 8} stroke={BURGUNDY} strokeWidth={1.3} strokeLinecap="round" className="vm-course" />
          <path d={`M${C.x} ${C.y - RING - 12} l-5 10 h10 Z`} fill={BURGUNDY} />
          <circle cx={C.x} cy={C.y - REACH} r={13} fill="none" stroke={BURGUNDY} strokeOpacity={0.4} strokeWidth={0.9} className="flow-node-ring" />
          <circle cx={C.x} cy={C.y - REACH} r={6} fill={BURGUNDY} stroke="#f4f0e6" strokeWidth={2} />
        </g>
      </g>
    </svg>
  );
}
