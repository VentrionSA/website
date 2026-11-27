import * as THREE from "three";

const DEG = Math.PI / 180;

/**
 * Converts latitude/longitude to a point on a sphere (three.js, y-up), matching the
 * layout of the globe's equirectangular texture (lib/geo/countries.json).
 */
export function latLonToVector3(lat: number, lon: number, radius = 1, target = new THREE.Vector3()) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return target.set(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/**
 * Points along a great-circle route between two places, raised off the surface in a
 * gentle arc: higher the further apart they are, never more than an eighth of the radius.
 */
export function arcPoints(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
  { radius = 1, segments = 64 }: { radius?: number; segments?: number } = {},
) {
  const va = latLonToVector3(a.lat, a.lon, 1);
  const vb = latLonToVector3(b.lat, b.lon, 1);
  const angle = va.angleTo(vb);
  const height = Math.min(0.006 + angle * 0.15, 0.12);
  const sinA = Math.sin(angle) || 1;
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // spherical linear interpolation, then lifted along the way
    const p = new THREE.Vector3()
      .addScaledVector(va, Math.sin((1 - t) * angle) / sinA)
      .addScaledVector(vb, Math.sin(t * angle) / sinA)
      .normalize();
    points.push(p.multiplyScalar(radius * (1 + height * Math.sin(Math.PI * t))));
  }
  return points;
}
