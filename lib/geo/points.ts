import data from "./land-points.json";

export type LandPoint = { lat: number; lon: number; /** Index into MARKETS, or -1 */ country: number };

type Row = [latE2: number, count: number, runs: number[]];

let cache: LandPoint[] | null = null;

/**
 * Decodes the run-length encoded land grid (≈7.5k points, 1.2° spacing)
 * generated from Natural Earth data via world-atlas.
 */
export function decodeLandPoints(): LandPoint[] {
  if (cache) return cache;
  const out: LandPoint[] = [];
  for (const [latE2, n, runs] of data.rows as Row[]) {
    const lat = latE2 / 100;
    const step = 360 / n;
    for (let i = 0; i < runs.length; i += 3) {
      const start = runs[i];
      const len = runs[i + 1];
      const country = runs[i + 2];
      for (let k = 0; k < len; k++) {
        out.push({ lat, lon: -180 + (start + k + 0.5) * step, country });
      }
    }
  }
  cache = out;
  return out;
}

/** Equirectangular projection helper for 2D fallbacks (returns 0–1 coordinates). */
export function projectEquirect(lat: number, lon: number) {
  return { x: (lon + 180) / 360, y: (90 - lat) / 180 };
}
