import * as THREE from "three";

const DEG = Math.PI / 180;

/** Converts latitude/longitude to a point on a sphere (three.js, y-up). */
export function latLonToVector3(lat: number, lon: number, radius = 1, target = new THREE.Vector3()) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return target.set(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/** Points along a raised great-circle arc between two lat/lon positions. */
export function arcPoints(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
  { radius = 1, segments = 64, lift = 0.25 }: { radius?: number; segments?: number; lift?: number } = {},
) {
  const va = latLonToVector3(a.lat, a.lon, 1);
  const vb = latLonToVector3(b.lat, b.lon, 1);
  const angle = va.angleTo(vb);
  const height = 0.04 + lift * (angle / Math.PI) * 1.6;
  const points: THREE.Vector3[] = [];
  const sinA = Math.sin(angle) || 1;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // spherical linear interpolation
    const w1 = Math.sin((1 - t) * angle) / sinA;
    const w2 = Math.sin(t * angle) / sinA;
    const p = new THREE.Vector3().addScaledVector(va, w1).addScaledVector(vb, w2).normalize();
    p.multiplyScalar(radius * (1 + height * Math.sin(Math.PI * t)));
    points.push(p);
  }
  return points;
}

/** Soft radial sprite texture used for glows and particles. */
export function makeGlowTexture(size = 64, inner = "rgba(255,240,210,1)", outer = "rgba(255,240,210,0)") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, inner.replace(/,\s*1\)$/, ",0.55)"));
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
