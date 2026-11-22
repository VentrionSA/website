"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { MARKETS } from "@/lib/content";
import countryData from "@/lib/geo/countries.json";
import { latLonToVector3 } from "./geo";

type Tier = "high" | "low";
type DragState = { dx: number; dragging: boolean };

type GlobeProps = {
  focusIndex: number;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  tier: Tier;
  /** Reduced motion: no pulsing highlight or breathing markers. */
  calm?: boolean;
};

type CountryData = { w: number; h: number; countries: { id: string | null; d: string }[] };

const DEG = Math.PI / 180;

/* Cartographic palette on porcelain: ivory sea, stone land, ink borders, burgundy network. */
const OCEAN = "#f4f0e6";
const LAND = "#e2d6c2";
const BORDER = "rgba(28,25,20,0.34)";
const NETWORK_FILL = "rgba(181,35,54,0.62)";
const NETWORK_BORDER = "rgba(120,22,36,0.5)";
const LIMB = "#c9bda7";
const BURGUNDY = "#b52336";
const GOLD = "#8d6b3b";
const PIN = "#f4f0e6";
/** ID mask encoding: market i is stored as (i + 1) * ID_STEP in the red channel. */
const ID_STEP = 24;

/* ── Map textures ──────────────────────────────────────────────────────── */

/**
 * Draws an equirectangular map from the Natural Earth country outlines
 * (lib/geo/countries.json): land, network fills and fine borders, plus a
 * low-resolution mask recording which network market each texel belongs to,
 * so the shader can highlight the focused market without redrawing.
 */
function useMapTextures(tier: Tier) {
  const gl = useThree((s) => s.gl);
  const textures = useMemo(() => {
    const data = countryData as CountryData;
    const W = tier === "high" ? 4096 : 2048;
    const H = W / 2;
    const scale = W / data.w;
    const paths = data.countries.map((c) => ({
      index: c.id ? MARKETS.findIndex((m) => m.id === c.id) : -1,
      path: new Path2D(c.d),
    }));

    const mapCanvas = document.createElement("canvas");
    mapCanvas.width = W;
    mapCanvas.height = H;
    const ctx = mapCanvas.getContext("2d")!;
    ctx.fillStyle = OCEAN;
    ctx.fillRect(0, 0, W, H);
    ctx.scale(scale, scale);
    ctx.lineJoin = "round";
    for (const { index, path } of paths) {
      ctx.fillStyle = LAND;
      ctx.fill(path);
      if (index >= 0) {
        ctx.fillStyle = NETWORK_FILL;
        ctx.fill(path);
      }
    }
    ctx.lineWidth = 0.55;
    ctx.strokeStyle = BORDER;
    for (const { path } of paths) ctx.stroke(path);
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = NETWORK_BORDER;
    for (const { index, path } of paths) if (index >= 0) ctx.stroke(path);

    const idCanvas = document.createElement("canvas");
    idCanvas.width = W / 2;
    idCanvas.height = H / 2;
    const ictx = idCanvas.getContext("2d")!;
    ictx.fillStyle = "#000";
    ictx.fillRect(0, 0, W / 2, H / 2);
    ictx.scale(scale / 2, scale / 2);
    for (const { index, path } of paths) {
      if (index < 0) continue;
      ictx.fillStyle = `rgb(${(index + 1) * ID_STEP},0,0)`;
      ictx.fill(path);
    }

    const map = new THREE.CanvasTexture(mapCanvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const ids = new THREE.CanvasTexture(idCanvas);
    ids.colorSpace = THREE.NoColorSpace;
    ids.minFilter = THREE.NearestFilter;
    ids.magFilter = THREE.NearestFilter;
    ids.generateMipmaps = false;
    return { map, ids };
  }, [gl, tier]);

  useEffect(
    () => () => {
      textures.map.dispose();
      textures.ids.dispose();
    },
    [textures],
  );

  return textures;
}

/* ── Globe body: the map on porcelain, with soft light ─────────────────── */

const bodyVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const bodyFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uIds;
  uniform float uFocus;
  uniform float uPulse;
  uniform vec3 uBurgundy;
  uniform vec3 uLimb;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec3 albedo = texture2D(uMap, vUv).rgb;
    // the focused market deepens to full burgundy
    float id = floor(texture2D(uIds, vUv).r * 255.0 / ${ID_STEP.toFixed(1)} + 0.5) - 1.0;
    float focus = 1.0 - step(0.5, abs(id - uFocus));
    albedo = mix(albedo, uBurgundy, focus * uPulse);
    // wrapped light: the soft, even fall-off of matte porcelain
    vec3 n = normalize(vN);
    vec3 v = normalize(vV);
    vec3 l = normalize(vec3(-0.55, 0.62, 0.58));
    float wrap = dot(n, l) * 0.5 + 0.5;
    vec3 col = albedo * mix(0.8, 1.03, smoothstep(0.1, 0.95, wrap));
    float facing = max(dot(n, v), 0.0);
    col = mix(col, uLimb, pow(1.0 - facing, 3.0) * 0.5);
    col += pow(max(dot(n, normalize(l + v)), 0.0), 90.0) * 0.12;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function GlobeBody({ focusIndex, tier, calm }: { focusIndex: number; tier: Tier; calm: boolean }) {
  const { map, ids } = useMapTextures(tier);

  const { body, graticule } = useMemo(() => {
    const body = new THREE.ShaderMaterial({
      vertexShader: bodyVertex,
      fragmentShader: bodyFragment,
      uniforms: {
        uMap: { value: null },
        uIds: { value: null },
        uFocus: { value: 0 },
        uPulse: { value: 0.85 },
        uBurgundy: { value: new THREE.Color(BURGUNDY) },
        uLimb: { value: new THREE.Color(LIMB) },
      },
    });
    // hairline graticule every 30°
    const verts: number[] = [];
    const v = new THREE.Vector3();
    const w = new THREE.Vector3();
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lon = -180; lon < 180; lon += 2) {
        latLonToVector3(lat, lon, 1.001, v);
        latLonToVector3(lat, lon + 2, 1.001, w);
        verts.push(v.x, v.y, v.z, w.x, w.y, w.z);
      }
    }
    for (let lon = -180; lon < 180; lon += 30) {
      for (let lat = -88; lat < 88; lat += 2) {
        latLonToVector3(lat, lon, 1.001, v);
        latLonToVector3(lat + 2, lon, 1.001, w);
        verts.push(v.x, v.y, v.z, w.x, w.y, w.z);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.14, depthWrite: false });
    return { body, graticule: new THREE.LineSegments(geo, lineMat) };
  }, []);

  useEffect(() => {
    body.uniforms.uMap.value = map;
    body.uniforms.uIds.value = ids;
  }, [body, map, ids]);

  useEffect(() => {
    body.uniforms.uFocus.value = focusIndex;
  }, [body, focusIndex]);

  useFrame(({ clock }) => {
    body.uniforms.uPulse.value = calm ? 0.85 : 0.85 + 0.15 * Math.sin(clock.getElapsedTime() * 2.2);
  });

  useEffect(
    () => () => {
      body.dispose();
      graticule.geometry.dispose();
      (graticule.material as THREE.Material).dispose();
    },
    [body, graticule],
  );

  return (
    <>
      <mesh material={body}>
        <sphereGeometry args={[1, 128, 96]} />
      </mesh>
      <primitive object={graticule} />
    </>
  );
}

/* ── Market markers ────────────────────────────────────────────────────── */

function Marker({
  index,
  focused,
  calm,
  onHover,
  onSelect,
}: {
  index: number;
  focused: boolean;
  calm: boolean;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
}) {
  const market = MARKETS[index];
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const position = useMemo(() => latLonToVector3(market.lat, market.lon, 1.006), [market]);
  const world = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    group.current?.lookAt(position.clone().multiplyScalar(2));
  }, [position]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring.current) {
      const phase = calm ? 0.35 : (t * 0.55 + index * 0.21) % 1;
      const s = 1 + phase * (focused ? 2.4 : 1.6);
      ring.current.scale.setScalar(s);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * (focused ? 0.9 : 0.45);
    }
  });

  const isFacing = (event: ThreeEvent<PointerEvent | MouseEvent>) => {
    event.object.getWorldPosition(world);
    return world.z > 0.15;
  };

  return (
    <group ref={group} position={position}>
      <mesh renderOrder={3}>
        <circleGeometry args={[focused ? 0.0145 : 0.0105, 24]} />
        <meshBasicMaterial color={PIN} toneMapped={false} depthWrite={false} transparent />
      </mesh>
      <mesh renderOrder={3}>
        <ringGeometry args={[focused ? 0.0145 : 0.0105, focused ? 0.019 : 0.0135, 32]} />
        <meshBasicMaterial color={BURGUNDY} toneMapped={false} depthWrite={false} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring} renderOrder={3}>
        <ringGeometry args={[0.02, 0.023, 48]} />
        <meshBasicMaterial color={GOLD} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Generous invisible hit area */}
      <mesh
        onPointerOver={(e) => {
          if (!isFacing(e)) return;
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          onHover(index);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
          onHover(null);
        }}
        onClick={(e) => {
          if (!isFacing(e)) return;
          e.stopPropagation();
          onSelect(index);
        }}
      >
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ── Rotation rig ──────────────────────────────────────────────────────── */

function targetFor(index: number) {
  const m = MARKETS[index];
  const v = latLonToVector3(m.lat, m.lon, 1);
  return { y: -Math.atan2(v.x, v.z), x: m.lat * DEG * 0.78 + 0.06 };
}

function Rig({ focusIndex, drag, children }: { focusIndex: number; drag: MutableRefObject<DragState>; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const target = useRef(targetFor(focusIndex));
  const size = useThree((s) => s.size);

  useEffect(() => {
    const next = targetFor(focusIndex);
    const current = group.current?.rotation.y ?? next.y;
    // choose the equivalent angle closest to the current rotation
    const twoPi = Math.PI * 2;
    next.y += Math.round((current - next.y) / twoPi) * twoPi;
    target.current = next;
  }, [focusIndex]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(delta, 0.05);
    if (drag.current.dx !== 0) {
      target.current.y += drag.current.dx * 0.006;
      drag.current.dx = 0;
    }
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, target.current.y, drag.current.dragging ? 10 : 2.6, d);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, target.current.x, 2.6, d);
    const s = size.width < 520 ? 0.94 : 1;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, s, 4, d));
  });

  return (
    <group ref={group} rotation={[target.current.x, target.current.y, 0]}>
      {children}
    </group>
  );
}

export default function GlobeCanvas({ focusIndex, onHover, onSelect, tier, calm = false }: GlobeProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState>({ dx: 0, dragging: false });
  const lastX = useRef(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let inView = false;
    const update = () => setActive(inView && document.visibilityState === "visible");
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <div
      ref={wrap}
      className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
      onPointerDown={(e) => {
        drag.current.dragging = true;
        lastX.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (!drag.current.dragging) return;
        drag.current.dx += e.clientX - lastX.current;
        lastX.current = e.clientX;
      }}
      onPointerUp={() => (drag.current.dragging = false)}
      onPointerLeave={() => (drag.current.dragging = false)}
      onPointerCancel={() => (drag.current.dragging = false)}
    >
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={tier === "high" ? [1, 1.75] : [1, 1.4]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 4.6], fov: 30, near: 0.1, far: 20 }}
      >
        <Rig focusIndex={focusIndex} drag={drag}>
          <GlobeBody focusIndex={focusIndex} tier={tier} calm={calm} />
          {MARKETS.map((_, i) => (
            <Marker key={i} index={i} focused={i === focusIndex} calm={calm} onHover={onHover} onSelect={onSelect} />
          ))}
        </Rig>
      </Canvas>
    </div>
  );
}
