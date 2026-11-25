/**
 * Bulk bags, drawn in isometric in the colours of the network map: two filled bags
 * rest on pallets while a third is lifted away on a crane hook, swaying gently,
 * carrying a burgundy tag. Geometry is computed from a small isometric projection.
 */

const C30 = Math.cos(Math.PI / 6);
const OX = 110;
const OY = 215;

type V = [number, number];
const pt = (x: number, y: number, z: number): V => [OX + (x - y) * C30, OY + (x + y) * 0.5 - z];
const f = (v: V) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;

const LINE = "rgb(24 67 53 / 0.55)";
const TOP = "#eef0e9";
const LEFT = "#e1e5dc";
const RIGHT = "#cdd4c9";

/** A filled bag on its box (x, y, z) with footprint w × d and height h, sides bulging. */
function Bag({ x, y, z, w = 60, d = 60, h = 66, loops = 7, spout = true }: { x: number; y: number; z: number; w?: number; d?: number; h?: number; loops?: number; spout?: boolean }) {
  // corners: b = bottom, t = top; back (x, y), left (x, y + d), front (x + w, y + d), right (x + w, y)
  const tB = pt(x, y, z + h);
  const tL = pt(x, y + d, z + h);
  const tF = pt(x + w, y + d, z + h);
  const tR = pt(x + w, y, z + h);
  const bL = pt(x, y + d, z);
  const bF = pt(x + w, y + d, z);
  const bR = pt(x + w, y, z);
  const bulge = 3.2;
  const sag = 2.6;
  const mid = (a: V, b: V): V => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  // left-front face: tL → tF → bF → bL, outer left edge bowing out, bottom sagging
  const leftFace = `M${f(tL)} L${f(tF)} L${f(bF)} Q${f([mid(bF, bL)[0], mid(bF, bL)[1] + sag])} ${f(bL)} Q${f([mid(bL, tL)[0] - bulge, mid(bL, tL)[1]])} ${f(tL)} Z`;
  // right-front face: tF → tR → bR → bF, outer right edge bowing out
  const rightFace = `M${f(tF)} L${f(tR)} Q${f([mid(tR, bR)[0] + bulge, mid(tR, bR)[1]])} ${f(bR)} Q${f([mid(bR, bF)[0], mid(bR, bF)[1] + sag])} ${f(bF)} Z`;
  // top: a little slumped in the middle
  const centre = pt(x + w / 2, y + d / 2, z + h - 2.5);
  const top = `M${f(tB)} Q${f(centre)} ${f(tR)} Q${f(centre)} ${f(tF)} Q${f(centre)} ${f(tL)} Q${f(centre)} ${f(tB)} Z`;

  // seams down each visible face, just inside the edges
  const seam = (a: V, b: V, dx: number) => `M${a[0] + dx},${a[1] + 3} L${b[0] + dx},${b[1] - 3}`;
  const loop = (p: V) => `M${p[0] - 3.4},${p[1] + 1} C${p[0] - 4.4},${p[1] - loops - 3} ${p[0] + 4.4},${p[1] - loops - 3} ${p[0] + 3.4},${p[1] + 1}`;
  const sc = pt(x + w / 2, y + d / 2, z + h - 1.5);

  return (
    <g strokeLinejoin="round">
      <path d={leftFace} fill={LEFT} stroke={LINE} strokeWidth={0.8} />
      <path d={rightFace} fill={RIGHT} stroke={LINE} strokeWidth={0.8} />
      <path d={top} fill={TOP} stroke={LINE} strokeWidth={0.8} />
      <g stroke={LINE} strokeWidth={0.6} strokeDasharray="2 2" fill="none">
        <path d={seam(tL, bL, 4)} />
        <path d={seam(tF, bF, -4)} />
        <path d={seam(tF, bF, 4)} />
        <path d={seam(tR, bR, -4)} />
      </g>
      <g stroke="#5b796c" strokeWidth={1.5} fill="none" strokeLinecap="round">
        {[tB, tL, tF, tR].map((p, i) => (
          <path key={i} d={loop(p)} />
        ))}
      </g>
      {spout ? (
        <g stroke={LINE} strokeWidth={0.7}>
          <path d={`M${sc[0] - 8},${sc[1]} L${sc[0] - 6.5},${sc[1] - 8} L${sc[0] + 6.5},${sc[1] - 8} L${sc[0] + 8},${sc[1]} Z`} fill={TOP} />
          <ellipse cx={sc[0]} cy={sc[1] - 8} rx={6.5} ry={2.6} fill={RIGHT} />
          <path d={`M${sc[0] - 7},${sc[1] - 4} L${sc[0] + 7},${sc[1] - 4}`} stroke="#5b796c" strokeWidth={1.2} />
        </g>
      ) : null}
    </g>
  );
}

/** A pallet under a bag: a low box with slats showing on its two visible faces. */
function Pallet({ x, y, w = 66, d = 66, h = 8 }: { x: number; y: number; w?: number; d?: number; h?: number }) {
  const tB = pt(x, y, h);
  const tL = pt(x, y + d, h);
  const tF = pt(x + w, y + d, h);
  const tR = pt(x + w, y, h);
  const bL = pt(x, y + d, 0);
  const bF = pt(x + w, y + d, 0);
  const bR = pt(x + w, y, 0);
  const gaps = (a0: V, a1: V, b0: V, b1: V) =>
    [0.3, 0.7].map((t) => {
      const p = [a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t];
      const q = [b0[0] + (b1[0] - b0[0]) * t, b0[1] + (b1[1] - b0[1]) * t];
      return `M${p[0].toFixed(1)},${(p[1] + 2.5).toFixed(1)} L${q[0].toFixed(1)},${q[1].toFixed(1)}`;
    });
  return (
    <g stroke={LINE} strokeWidth={0.7} strokeLinejoin="round">
      <path d={`M${f(tL)} L${f(tF)} L${f(bF)} L${f(bL)} Z`} fill="#6f8a7e" />
      <path d={`M${f(tF)} L${f(tR)} L${f(bR)} L${f(bF)} Z`} fill="#5b796c" />
      <path d={`M${f(tB)} L${f(tR)} L${f(tF)} L${f(tL)} Z`} fill="#86a094" />
      <g stroke="#f4f0e6" strokeOpacity={0.6}>
        {gaps(tL, tF, bL, bF).map((d) => (
          <path key={d} d={d} />
        ))}
        {gaps(tF, tR, bF, bR).map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </g>
  );
}

export function BulkBags() {
  // the lifted bag: footprint x 96–156, y −130 to −70, hanging 64 units above the ground
  const lift = { x: 96, y: -130, z: 64 };
  const hook: V = pt(126, -100, 192);
  const corners: V[] = [pt(96, -130, 130), pt(96, -70, 130), pt(156, -70, 130), pt(156, -130, 130)];
  const shadow = pt(126, -100, 0);
  // tag on the lifted bag's left-front face (y = −70), in face coordinates
  const tag = [pt(108, -70, 112), pt(140, -70, 112), pt(140, -70, 88), pt(108, -70, 88)];
  const tagLine = (zz: number, x1: number) => `M${f(pt(112, -70, zz))} L${f(pt(x1, -70, zz))}`;

  return (
    <svg viewBox="0 0 400 300" className="block h-auto w-full" role="img" aria-label="Bulk bags on pallets, one lifted on a crane hook.">
      {/* ground line and the lifted bag's shadow */}
      <line x1={14} y1={276} x2={386} y2={276} stroke={LINE} strokeOpacity={0.5} strokeWidth={0.6} />
      <ellipse cx={shadow[0]} cy={shadow[1]} rx={46} ry={17} fill="#184335" fillOpacity={0.07} className="bag-shadow" />

      {/* the bags on the ground: the one behind first */}
      <Pallet x={-3} y={-77} />
      <Bag x={0} y={-74} z={8} />
      <Pallet x={-3} y={-3} />
      <Bag x={0} y={0} z={8} />

      {/* the bag being lifted: hook, slings, bag and tag sway together from the cable above */}
      <g className="bag-sway" style={{ transformOrigin: `${hook[0]}px -130px` }}>
        {/* the crane's cable runs up out of the drawing */}
        <line x1={hook[0]} y1={-130} x2={hook[0]} y2={hook[1] - 16} stroke="#184335" strokeWidth={1.2} />
        <g stroke="#5b796c" strokeWidth={1.1} fill="none">
          {corners.map((c, i) => (
            <line key={i} x1={hook[0]} y1={hook[1]} x2={c[0]} y2={c[1] - 9} />
          ))}
        </g>
        <Bag x={lift.x} y={lift.y} z={lift.z} loops={10} spout={false} />
        <path d={`M${f(tag[0])} L${f(tag[1])} L${f(tag[2])} L${f(tag[3])} Z`} fill="#b52336" stroke="#96192a" strokeWidth={0.6} />
        <g stroke="#f4f0e6" strokeOpacity={0.85} strokeWidth={1}>
          <path d={tagLine(105, 134)} />
          <path d={tagLine(98, 128)} />
        </g>
        {/* the hook */}
        <path
          d={`M${hook[0]},${hook[1] - 17} L${hook[0]},${hook[1] - 9} C${hook[0]},${hook[1] - 2} ${hook[0] + 7},${hook[1] + 1} ${hook[0] + 8},${hook[1] - 5} M${hook[0] - 3.5},${hook[1] - 17} L${hook[0] + 3.5},${hook[1] - 17}`}
          stroke="#184335"
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx={hook[0]} cy={hook[1]} r={1.8} fill="#184335" />
      </g>
    </svg>
  );
}
