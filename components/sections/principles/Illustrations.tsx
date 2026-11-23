import type { CSSProperties, ReactNode } from "react";
import { MARK_PATH } from "@/components/brand/logo-paths";
import type { PrincipleId } from "@/lib/content";

/*
 * Fine green line drawings, one per principle. Elements marked data-draw,
 * data-pop and data-fade animate in (CSS, see .ill in globals.css) when the
 * root svg has data-active="true"; --d is the delay in ms, --o a target opacity.
 */

const C = 200;
const DEG = Math.PI / 180;
const MARK_W = 759;
const MARK_H = 767;

const polar = (r: number, deg: number): [number, number] => [C + r * Math.cos(deg * DEG), C + r * Math.sin(deg * DEG)];
const d = (ms: number, o?: number) => ({ "--d": ms, ...(o !== undefined ? { "--o": o } : {}) }) as CSSProperties;

/** The Ventrion star, exactly as the logo: same path, same fill rule, always upright. */
function Star({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const s = size / MARK_W;
  return (
    <g data-pop style={d(delay)}>
      <path
        d={MARK_PATH}
        fillRule="evenodd"
        stroke="none"
        className="fill-mark"
        transform={`translate(${x - size / 2} ${y - (MARK_H * s) / 2}) scale(${s})`}
      />
    </g>
  );
}

function Node({ x, y, delay, ring = 9 }: { x: number; y: number; delay: number; ring?: number }) {
  return (
    <g data-pop style={d(delay)}>
      <circle cx={x} cy={y} r={3.6} fill="currentColor" />
      <circle cx={x} cy={y} r={ring} fill="none" stroke="currentColor" strokeOpacity={0.5} />
    </g>
  );
}

function Frame({ active, label, children }: { active: boolean; label: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className="ill h-full w-full overflow-visible text-mark"
      data-active={active ? "true" : "false"}
      aria-hidden="true"
      data-label={label}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinecap="round"
    >
      {children}
    </svg>
  );
}

/* I. Principals we know: growth rings of long cooperation, direct lines to each principal. */
const RINGS = [58, 96, 134, 170];
const PRINCIPALS: [number, number][] = [
  [96, -62],
  [134, -10],
  [170, 34],
  [58, 120],
  [134, 158],
  [96, 214],
  [170, 258],
];

function Principals({ active }: { active: boolean }) {
  const nodes = PRINCIPALS.map(([r, a]) => polar(r, a));
  return (
    <Frame active={active} label="Principals we know">
      <g className="ill-orbit">
        {RINGS.map((r, i) => (
          <circle key={r} cx={C} cy={C} r={r} pathLength={1} data-draw style={d(i * 160)} strokeOpacity={0.22 + i * 0.05} />
        ))}
        {nodes.map(([x, y], i) => {
          const [sx, sy] = polar(26, PRINCIPALS[i][1]);
          return <line key={`l${i}`} x1={sx} y1={sy} x2={x} y2={y} pathLength={1} data-draw style={d(700 + i * 110)} strokeOpacity={0.6} />;
        })}
        {[
          [0, 1],
          [1, 2],
          [4, 5],
          [5, 6],
        ].map(([a, b]) => (
          <line key={`c${a}${b}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} pathLength={1} data-draw style={d(1400 + a * 80)} strokeOpacity={0.3} />
        ))}
        {nodes.map(([x, y], i) => (
          <Node key={`n${i}`} x={x} y={y} delay={1000 + i * 110} />
        ))}
      </g>
      <circle cx={C} cy={C} r={24} pathLength={1} data-draw style={d(300)} strokeOpacity={0.7} />
      <Star x={C} y={C} size={34} delay={250} />
    </Frame>
  );
}

/* II. Local knowledge, Ventrion responsibility: two local markets, one coordinated passage. */
const ORIGIN: [number, number] = [95, 270];
const DEST: [number, number] = [305, 270];
const ARC = "M95 222 Q200 34 305 222";

function localDots([cx, cy]: [number, number]) {
  const out: [number, number][] = [];
  for (let x = -36; x <= 36; x += 8.5) {
    for (let y = -36; y <= 36; y += 8.5) {
      if (x * x + y * y <= 36 * 36) out.push([cx + x, cy + y]);
    }
  }
  return out;
}

function Local({ active }: { active: boolean }) {
  return (
    <Frame active={active} label="Local knowledge, Ventrion responsibility">
      {[ORIGIN, DEST].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={48} pathLength={1} data-draw style={d(i * 200)} strokeOpacity={0.6} />
          <g data-fade style={d(500 + i * 200, 0.55)} stroke="none" fill="currentColor">
            {localDots([x, y]).map(([px, py]) => (
              <circle key={`${px}-${py}`} cx={px} cy={py} r={1.25} />
            ))}
          </g>
          <text
            x={x}
            y={y + 76}
            textAnchor="middle"
            data-fade
            style={{ ...d(900 + i * 200), fontFamily: "var(--font-sans)", fontSize: 9.5, letterSpacing: 2.6 }}
            className="fill-mist"
            stroke="none"
          >
            {i === 0 ? "ORIGIN" : "DESTINATION"}
          </text>
        </g>
      ))}
      <path d={ARC} pathLength={1} data-draw style={d(600)} strokeOpacity={0.85} />
      <g data-fade style={d(1200, 0.35)} strokeDasharray="2 5">
        <line x1={200} y1={128} x2={ORIGIN[0]} y2={ORIGIN[1]} />
        <line x1={200} y1={128} x2={DEST[0]} y2={DEST[1]} />
      </g>
      <circle cx={200} cy={128} r={30} pathLength={1} data-draw style={d(1100)} strokeOpacity={0.5} />
      <Star x={200} y={128} size={32} delay={1000} />
      <circle r={3.4} fill="currentColor" stroke="none" className="ill-traveller" data-fade style={d(1600)}>
        <animateMotion dur="5.5s" repeatCount="indefinite" path={ARC} />
      </circle>
    </Frame>
  );
}

/* III. Quality over quantity: a directory of anonymous dots, a few chosen counterparts. */
const GRID: [number, number][] = [];
for (let c = 0; c <= 10; c++) for (let r = 0; r <= 10; r++) if (!(c === 5 && r === 5)) GRID.push([50 + c * 30, 50 + r * 30]);
const CHOSEN: [number, number][] = [
  [110, 110],
  [260, 80],
  [320, 200],
  [260, 320],
  [110, 290],
];

function Quality({ active }: { active: boolean }) {
  return (
    <Frame active={active} label="Quality over quantity">
      <g data-fade style={d(0, 0.22)} stroke="none" className="fill-ivory">
        {GRID.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={1.5} />
        ))}
      </g>
      {CHOSEN.map(([x, y], i) => {
        const [nx, ny] = CHOSEN[(i + 1) % CHOSEN.length];
        return (
          <g key={i}>
            <line x1={C} y1={C} x2={x} y2={y} pathLength={1} data-draw style={d(900 + i * 110)} strokeOpacity={0.55} />
            <line x1={x} y1={y} x2={nx} y2={ny} pathLength={1} data-draw style={d(1300 + i * 110)} strokeOpacity={0.28} />
          </g>
        );
      })}
      {CHOSEN.map(([x, y], i) => (
        <Node key={i} x={x} y={y} delay={500 + i * 120} ring={10} />
      ))}
      <circle cx={C} cy={C} r={22} fill="var(--color-ink)" pathLength={1} data-draw style={d(300)} strokeOpacity={0.7} />
      <Star x={C} y={C} size={30} delay={300} />
    </Frame>
  );
}

/* IV. Global reach, personal accountability: the world held at the Ventrion ring, the client at its centre. */
const FAR: [number, number][] = [
  [150, -40],
  [158, 32],
  [146, 128],
  [160, 205],
];

function Accountability({ active }: { active: boolean }) {
  return (
    <Frame active={active} label="Global reach with personal accountability">
      <g strokeOpacity={0.26}>
        <circle cx={C} cy={C} r={165} pathLength={1} data-draw style={d(0)} />
        <ellipse cx={C} cy={C} rx={165} ry={46} pathLength={1} data-draw style={d(150)} />
        <ellipse cx={C} cy={C} rx={60} ry={165} pathLength={1} data-draw style={d(250)} />
        <ellipse cx={C} cy={C} rx={118} ry={165} pathLength={1} data-draw style={d(350)} />
        <ellipse cx={C} cy={118} rx={143} ry={38} pathLength={1} data-draw style={d(450)} />
        <ellipse cx={C} cy={282} rx={143} ry={38} pathLength={1} data-draw style={d(550)} />
      </g>
      {FAR.map(([r, a], i) => {
        const [x, y] = polar(r, a);
        const [ex, ey] = polar(64, a);
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={ex} y2={ey} pathLength={1} data-draw style={d(900 + i * 140)} strokeOpacity={0.55} />
            <Node x={x} y={y} delay={800 + i * 140} ring={8} />
          </g>
        );
      })}
      <circle cx={C} cy={C} r={64} pathLength={1} data-draw style={d(700)} strokeOpacity={0.75} />
      <Star x={C} y={C - 64} size={26} delay={1300} />
      <g data-pop style={d(1500)}>
        <circle cx={C} cy={C} r={14} strokeOpacity={0.6} />
        <circle cx={C} cy={C} r={5} stroke="none" className="fill-ivory" />
      </g>
    </Frame>
  );
}

const ILLUSTRATIONS: Record<PrincipleId, (props: { active: boolean }) => ReactNode> = {
  principals: Principals,
  local: Local,
  quality: Quality,
  accountability: Accountability,
};

export function PrincipleIllustration({ id, active }: { id: PrincipleId; active: boolean }) {
  const Illustration = ILLUSTRATIONS[id];
  return <Illustration active={active} />;
}
