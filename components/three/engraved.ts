"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { decodeLandPoints } from "@/lib/geo/points";

/* ── Engraved land texture for the metallic core ───────────────────────── */

export function useEngravedMaps(size: number) {
  return useMemo(() => {
    const w = size;
    const h = size / 2;
    const bump = document.createElement("canvas");
    const rough = document.createElement("canvas");
    const color = document.createElement("canvas");
    bump.width = rough.width = color.width = w;
    bump.height = rough.height = color.height = h;
    const b = bump.getContext("2d")!;
    const r = rough.getContext("2d")!;
    const c = color.getContext("2d")!;
    b.fillStyle = "#000";
    b.fillRect(0, 0, w, h);
    r.fillStyle = "#fff";
    r.fillRect(0, 0, w, h);
    // deep bronze "ocean" so gilded continents read clearly at any resolution
    c.fillStyle = "#8d7249";
    c.fillRect(0, 0, w, h);

    // graticule, very fine
    b.strokeStyle = "rgba(255,255,255,0.22)";
    r.strokeStyle = "rgba(150,150,150,1)";
    c.strokeStyle = "rgba(226,201,152,0.4)";
    b.lineWidth = r.lineWidth = c.lineWidth = Math.max(1, w / 2048);
    for (let lat = -75; lat <= 75; lat += 15) {
      const y = ((90 - lat) / 180) * h;
      b.beginPath();
      b.moveTo(0, y);
      b.lineTo(w, y);
      b.stroke();
      r.beginPath();
      r.moveTo(0, y);
      r.lineTo(w, y);
      r.stroke();
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }
    for (let lon = -180; lon < 180; lon += 15) {
      const x = ((lon + 180) / 360) * w;
      b.beginPath();
      b.moveTo(x, 0);
      b.lineTo(x, h);
      b.stroke();
      r.beginPath();
      r.moveTo(x, 0);
      r.lineTo(x, h);
      r.stroke();
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, h);
      c.stroke();
    }

    // land dots (ellipses compensate for equirectangular stretch)
    const dot = (w / 2048) * 2.3;
    b.fillStyle = "#fff";
    r.fillStyle = "#5a5a5a";
    c.fillStyle = "#fff0cc";
    for (const p of decodeLandPoints()) {
      const x = ((p.lon + 180) / 360) * w;
      const y = ((90 - p.lat) / 180) * h;
      const rx = dot / Math.max(0.2, Math.cos((p.lat * Math.PI) / 180));
      b.beginPath();
      b.ellipse(x, y, rx, dot, 0, 0, Math.PI * 2);
      b.fill();
      r.beginPath();
      r.ellipse(x, y, rx, dot, 0, 0, Math.PI * 2);
      r.fill();
      c.beginPath();
      c.ellipse(x, y, rx * 1.05, dot * 1.05, 0, 0, Math.PI * 2);
      c.fill();
    }

    const bumpTex = new THREE.CanvasTexture(bump);
    const roughTex = new THREE.CanvasTexture(rough);
    const colorTex = new THREE.CanvasTexture(color);
    for (const t of [bumpTex, roughTex, colorTex]) {
      t.anisotropy = 8;
      t.colorSpace = THREE.NoColorSpace;
      t.needsUpdate = true;
    }
    colorTex.colorSpace = THREE.SRGBColorSpace;
    return { bumpTex, roughTex, colorTex };
  }, [size]);
}
