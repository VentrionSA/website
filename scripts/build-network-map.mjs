/**
 * Builds lib/geo/network-map.ts: the country outlines for the network's world map.
 *
 * Natural Earth country shapes at 1:50m (world-atlas), projected to Equal Earth (an
 * equal-area world map with gently curved sides), clipped to the Arctic islands and
 * Cape Horn (Antarctica is left out), simplified, and written as compact SVG paths in
 * whole map units with relative moves. Countries in the part of the world the map
 * zooms into (Europe, Africa, Asia, Oceania) keep fine detail; the Americas, only ever
 * seen at world scale, are simplified more. Marker positions and the camera use the
 * same projection at runtime: see components/sections/network/NetworkMap.tsx.
 *
 *     npm run build:map
 */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { geoBounds, geoEqualEarth, geoEqualEarthRaw, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const topo = JSON.parse(fs.readFileSync(`${ROOT}node_modules/world-atlas/countries-50m.json`, "utf8"));
const OUT = `${ROOT}lib/geo/network-map.ts`;

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

const WIDTH = 10000; // map units across the whole world
const LAT_MAX = 84; // the Arctic islands
const LAT_MIN = -57; // Cape Horn; Antarctica is left out
const rad = Math.PI / 180;
const X_MAX = geoEqualEarthRaw(Math.PI, 0)[0];
const Y_TOP = geoEqualEarthRaw(0, LAT_MAX * rad)[1];
const SCALE = WIDTH / (2 * X_MAX);
const HEIGHT = Math.round(SCALE * (Y_TOP - geoEqualEarthRaw(0, LAT_MIN * rad)[1]));

const projection = geoEqualEarth()
  .scale(SCALE)
  .translate([SCALE * X_MAX, SCALE * Y_TOP])
  .precision(0.5)
  .clipExtent([
    [-10, -10],
    [WIDTH + 10, HEIGHT + 10],
  ]);

/** Detail: fine where the map zooms in, coarse elsewhere (map units). */
const FINE = { tolerance: 1.6, minArea: 40 };
const COARSE = { tolerance: 6, minArea: 160 };
const inZoomArea = ([[west, south], [east, north]]) =>
  (east >= -25 || west > east) && west <= 180 && north >= -50 && south <= 85;

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

function countryPath(geometry, detail, isNetwork) {
  let path = "";
  for (const ring of rings(geometry)) {
    const a = area(ring);
    if (!isNetwork && a < detail.minArea) continue;
    // split the closed ring in two halves so the simplification keeps its shape
    const mid = Math.floor(ring.length / 2);
    const tol = a > detail.minArea * 20 ? detail.tolerance : detail.tolerance / 3; // keep small islands recognisable
    const pts = [...simplify(ring.slice(0, mid + 1), tol).slice(0, -1), ...simplify([...ring.slice(mid), ring[0]], tol).slice(0, -1)];
    path += encode(pts);
  }
  return path;
}

const countries = feature(topo, topo.objects.countries).features;
let land = "";
const network = {};
for (const country of countries) {
  if (country.id === "010") continue; // Antarctica
  const id = NETWORK[country.id];
  const detail = id || inZoomArea(geoBounds(country)) ? FINE : COARSE;
  const path = countryPath(country, detail, Boolean(id));
  if (!path) continue;
  if (id) network[id] = (network[id] ?? "") + path;
  else land += path;
}

const missing = Object.values(NETWORK).filter((id) => !network[id]);
if (missing.length) throw new Error(`Network countries not found: ${missing.join(", ")}`);

const lines = [
  "// Generated by scripts/build-network-map.mjs (npm run build:map). Do not edit by hand.",
  "// Natural Earth 1:50m in the Equal Earth projection, Antarctica left out; whole map units.",
  "",
  `export const MAP_PROJECTION = { scale: ${SCALE.toFixed(6)}, xMax: ${X_MAX.toFixed(6)}, yTop: ${Y_TOP.toFixed(6)}, latMin: ${LAT_MIN}, latMax: ${LAT_MAX} } as const;`,
  `export const MAP_SIZE = { width: ${WIDTH}, height: ${HEIGHT} } as const;`,
  "",
  "/** Every country not in the network, as one path. */",
  `export const LAND_PATH =\n  ${JSON.stringify(land)};`,
  "",
  "/** The network's countries, by market id (see MARKETS in lib/content.ts). */",
  "export const NETWORK_PATHS: Record<string, string> = {",
  ...Object.keys(network)
    .sort()
    .map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(network[key])},`),
  "};",
  "",
];
fs.writeFileSync(OUT, lines.join("\n"));
const size = fs.statSync(OUT).size;
console.log(
  `wrote ${OUT.replace(ROOT, "")}: ${(size / 1024).toFixed(1)} KB; land ${land.length} chars, network ${Object.values(network).reduce((n, p) => n + p.length, 0)} chars; ${WIDTH} x ${HEIGHT}`,
);
