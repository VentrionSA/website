/**
 * Builds lib/geo/countries.json: the country outlines the network globe paints as its
 * texture (components/three/GlobeCanvas.tsx), and the flat map it falls back to.
 *
 * Natural Earth country shapes at 1:50m (world-atlas) in the equirectangular projection,
 * longitude and latitude as x and y, which is how a sphere's texture is laid out. One map
 * unit is one texel of the globe's sharpest texture (4096 x 2048). Outlines are simplified
 * to that resolution, more where the projection stretches them towards the poles, and
 * written as compact SVG paths. The network's countries are tagged with their market id
 * (see MARKETS in lib/content.ts) and keep every island.
 *
 *     npm run build:map
 */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const topo = JSON.parse(fs.readFileSync(`${ROOT}node_modules/world-atlas/countries-50m.json`, "utf8"));
const OUT = `${ROOT}lib/geo/countries.json`;

/** The network's markets, by ISO 3166-1 numeric code (see MARKETS in lib/content.ts). */
const NETWORK = {
  682: "saudi-arabia",
  784: "united-arab-emirates",
  634: "qatar",
  "048": "bahrain",
  398: "kazakhstan",
  "031": "azerbaijan",
  156: "china",
  356: "india",
  360: "indonesia",
};

const W = 4096;
const H = W / 2;
const projection = geoEquirectangular()
  .scale(W / (2 * Math.PI))
  .translate([W / 2, H / 2])
  .precision(0.1);

/** Simplification tolerance and the smallest island kept, in texels. */
const TOLERANCE = 0.55;
const MIN_AREA = 2.5;

function rings(geometry) {
  const out = [];
  let ring = null;
  const context = {
    moveTo(x, y) {
      ring = [[x, y]];
      out.push(ring);
    },
    lineTo(x, y) {
      ring.push([x, y]);
    },
    closePath() {},
    arc() {},
  };
  geoPath(projection, context)(geometry);
  return out;
}

function area(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  return Math.abs(a) / 2;
}

/** Douglas-Peucker on an open polyline (iterative). */
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const norm = Math.hypot(dx, dy) || 1e-9;
    let best = 0;
    let index = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * points[i][0] - dx * points[i][1] + bx * ay - by * ax) / norm;
      if (d > best) {
        best = d;
        index = i;
      }
    }
    if (best > tolerance && index > 0) {
      keep[index] = 1;
      stack.push([a, index], [index, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function encode(points) {
  const pts = [];
  for (const [x, y] of points) {
    const p = [Math.round(x), Math.round(y)];
    const last = pts[pts.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) pts.push(p);
  }
  if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
  if (pts.length < 3) return "";
  let body = "";
  for (let i = 1; i < pts.length; i++) {
    for (const n of [pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]) {
      const s = String(n);
      body += body && !s.startsWith("-") ? ` ${s}` : s;
    }
  }
  return `M${pts[0][0]} ${pts[0][1]}l${body}z`;
}

function countryPath(geometry, isNetwork) {
  let path = "";
  for (const ring of rings(geometry)) {
    const a = area(ring);
    if (!isNetwork && a < MIN_AREA) continue;
    // the projection widens everything by 1 / cos(latitude): simplify as much more there
    const meanY = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;
    const lat = ((H / 2 - meanY) / H) * Math.PI;
    let tol = TOLERANCE / Math.max(Math.cos(lat), 0.25);
    if (isNetwork) tol = Math.min(tol, TOLERANCE * 0.6);
    else if (a < MIN_AREA * 30) tol /= 2; // keep small islands recognisable
    // split the closed ring in two halves so the simplification keeps its shape
    const mid = Math.floor(ring.length / 2);
    const pts = [...simplify(ring.slice(0, mid + 1), tol).slice(0, -1), ...simplify([...ring.slice(mid), ring[0]], tol).slice(0, -1)];
    path += encode(pts);
  }
  return path;
}

// One entry per country, so each is stroked on its own: shared borders read a shade
// deeper than coastlines, as on a printed map.
const out = [];
for (const country of feature(topo, topo.objects.countries).features) {
  const id = NETWORK[country.id] ?? null;
  const d = countryPath(country, Boolean(id));
  if (d) out.push({ id, d });
}

const missing = Object.values(NETWORK).filter((id) => !out.some((c) => c.id === id));
if (missing.length) throw new Error(`Network countries not found: ${missing.join(", ")}`);

const data = { w: W, h: H, countries: out };
fs.writeFileSync(OUT, `${JSON.stringify(data)}\n`);
const size = fs.statSync(OUT).size;
console.log(`wrote ${OUT.replace(ROOT, "")}: ${(size / 1024).toFixed(1)} KB; ${W} x ${H}`);
