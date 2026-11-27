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
