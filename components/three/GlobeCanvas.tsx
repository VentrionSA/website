"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { decodeLandPoints } from "@/lib/geo/points";
import { MARKETS } from "@/lib/content";
import { latLonToVector3 } from "./geo";
import { useEngravedMaps } from "./engraved";

type Tier = "high" | "low";
type DragState = { dx: number; dragging: boolean };

type GlobeProps = {
  focusIndex: number;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  tier: Tier;
  /** Reduced motion: no flowing dashes, pulses or breathing markers. */
  calm?: boolean;
};

const DEG = Math.PI / 180;
const GOLD = "#c4a779";
const IVORY = "#f1efe8";
const GOLD_LIGHT = "#f6e3bb";

/* ── Land dots ─────────────────────────────────────────────────────────── */

const dotVertex = /* glsl */ `
  attribute float aCountry;
  uniform float uFocus;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uTime;
  varying float vFacing;
  varying float vNetwork;
  varying float vFocus;
  varying float vShimmer;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normalize(position));
    vFacing = dot(n, normalize(-mv.xyz));
    vNetwork = step(-0.5, aCountry);
    vFocus = 1.0 - step(0.5, abs(aCountry - uFocus));
    // a slow band of light sweeping across every connected country
    float lon = atan(position.x, position.z);
    vShimmer = pow(0.5 + 0.5 * sin(uTime * 0.9 - lon * 3.0 + position.y * 2.0), 6.0);
    float pulse = 1.0 + vFocus * (0.3 + 0.12 * sin(uTime * 2.4)) + vShimmer * 0.2;
    gl_PointSize = uSize * uPixelRatio * pulse * (4.6 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const dotFragment = /* glsl */ `
  uniform vec3 uGold;
  uniform vec3 uLight;
  varying float vFacing;
  varying float vNetwork;
  varying float vFocus;
  varying float vShimmer;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5 || vNetwork < 0.5) discard;
    // bright core with a soft halo, so connected countries glow above the engraved surface
    float core = smoothstep(0.26, 0.12, d);
    float halo = smoothstep(0.5, 0.18, d) * 0.55;
    float rim = smoothstep(-0.05, 0.45, vFacing);
    float lift = max(vFocus, vShimmer * 0.8);
    vec3 col = mix(uGold, uLight, 0.55 + 0.45 * lift);
    col = mix(col, vec3(1.0, 0.95, 0.84), core * (0.18 + 0.27 * vFocus));
    col *= 1.3 + 0.65 * lift;
    float alpha = max(core, halo) * rim;
    gl_FragColor = vec4(col, alpha);
  }
`;

function LandDots({ focusIndex, tier, calm }: { focusIndex: number; tier: Tier; calm: boolean }) {
  const gl = useThree((s) => s.gl);
  const { geometry, material } = useMemo(() => {
    const pts = decodeLandPoints();
    const positions = new Float32Array(pts.length * 3);
    const country = new Float32Array(pts.length);
    const v = new THREE.Vector3();
    pts.forEach((p, i) => {
      latLonToVector3(p.lat, p.lon, 1.004, v);
      positions.set([v.x, v.y, v.z], i * 3);
      country[i] = p.country;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aCountry", new THREE.BufferAttribute(country, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: dotVertex,
      fragmentShader: dotFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uFocus: { value: focusIndex },
        uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
        uSize: { value: tier === "high" ? 5.4 : 4.8 },
        uTime: { value: 0 },
        uGold: { value: new THREE.Color(GOLD) },
        uLight: { value: new THREE.Color(GOLD_LIGHT) },
      },
    });
    return { geometry: geo, material: mat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, tier]);

  useEffect(() => {
    material.uniforms.uFocus.value = focusIndex;
  }, [focusIndex, material]);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = calm ? 0 : clock.getElapsedTime();
  });

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <points geometry={geometry} material={material} />;
}

/* ── Globe body, atmosphere and graticule ──────────────────────────────── */

const bodyVertex = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const bodyFragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uRim;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float facing = max(dot(vN, vV), 0.0);
    float fres = pow(1.0 - facing, 3.0);
    vec3 light = normalize(vec3(-0.5, 0.6, 0.65));
    float lambert = max(dot(vN, light), 0.0);
    vec3 col = uBase * (0.65 + 0.55 * lambert) + uRim * fres * 0.5;
    gl_FragColor = vec4(col, 1.0);
  }
`;
const haloFragment = /* glsl */ `
  uniform vec3 uRim;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float facing = dot(vN, vV);
    float glow = pow(clamp(1.0 + facing * 2.8, 0.0, 1.0), 4.0);
    gl_FragColor = vec4(uRim, glow * 0.14);
  }
`;

function GlobeBody() {
  const { body, halo, graticule } = useMemo(() => {
    const uniforms = { uBase: { value: new THREE.Color("#121412") }, uRim: { value: new THREE.Color(GOLD) } };
    const body = new THREE.ShaderMaterial({ vertexShader: bodyVertex, fragmentShader: bodyFragment, uniforms });
    const halo = new THREE.ShaderMaterial({
      vertexShader: bodyVertex,
      fragmentShader: haloFragment,
      uniforms,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    // graticule every 30°
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
    const lineMat = new THREE.LineBasicMaterial({ color: IVORY, transparent: true, opacity: 0.05, depthWrite: false });
    return { body, halo, graticule: new THREE.LineSegments(geo, lineMat) };
  }, []);

  const { bumpTex, roughTex, colorTex } = useEngravedMaps(4096);
  void body;
  void graticule;
  return (
    <>
      <mesh>
        <sphereGeometry args={[1, 160, 112]} />
        <meshPhysicalMaterial
          color="#ffffff"
          map={colorTex}
          metalness={1}
          roughness={0.44}
          roughnessMap={roughTex}
          bumpMap={bumpTex}
          bumpScale={3}
          clearcoat={0.5}
          clearcoatRoughness={0.32}
          envMapIntensity={1.2}
        />
      </mesh>
      <mesh material={halo} scale={1.1}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
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
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * (focused ? 0.9 : 0.5);
    }
  });

  const isFacing = (event: ThreeEvent<PointerEvent | MouseEvent>) => {
    event.object.getWorldPosition(world);
    return world.z > 0.15;
  };

  return (
    <group ref={group} position={position}>
      <mesh renderOrder={3}>
        <circleGeometry args={[focused ? 0.017 : 0.012, 24]} />
        <meshBasicMaterial color={focused ? "#f3dfb6" : GOLD} toneMapped={false} depthWrite={false} transparent />
      </mesh>
      <mesh ref={ring} renderOrder={3}>
        <ringGeometry args={[0.02, 0.023, 48]} />
        <meshBasicMaterial color={GOLD} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {focused ? (
        <mesh renderOrder={3}>
          <ringGeometry args={[0.04, 0.0425, 64]} />
          <meshBasicMaterial color="#f3dfb6" transparent opacity={0.85} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
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

/**
 * Callout offsets for each market's label, in px for a 640px-wide globe (scaled
 * with the globe). The four Gulf markets sit a few pixels apart, so their labels
 * fan out in different directions; north stays up as the globe turns, so the
 * arrangement holds at every rotation.
 */
const CALLOUTS: Record<string, { dx: number; dy: number; short?: string }> = {
  "saudi-arabia": { dx: -78, dy: 16 },
  "united-arab-emirates": { dx: 34, dy: 58, short: "UAE" },
  qatar: { dx: 64, dy: -22 },
  bahrain: { dx: -36, dy: -52 },
  kazakhstan: { dx: 48, dy: -40 },
  azerbaijan: { dx: -72, dy: -14 },
  china: { dx: 56, dy: -22 },
  india: { dx: 58, dy: 10 },
  indonesia: { dx: -34, dy: 44 },
};

/** Projects every market to screen space each frame and moves its DOM callout over the canvas. */
function LabelsTracker({
  labelRefs,
  chipRefs,
  chipWidths,
}: {
  labelRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  chipRefs: MutableRefObject<(HTMLSpanElement | null)[]>;
  chipWidths: MutableRefObject<number[]>;
}) {
  const anchor = useRef<THREE.Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  const n = useMemo(() => new THREE.Vector3(), []);
  const c = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, size }) => {
    const a = anchor.current;
    if (!a) return;
    c.copy(camera.position).normalize();
    MARKETS.forEach((m, i) => {
      const el = labelRefs.current[i];
      if (!el) return;
      latLonToVector3(m.lat, m.lon, 1.006, v);
      a.localToWorld(v);
      const facing = n.copy(v).normalize().dot(c);
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = String(THREE.MathUtils.clamp((facing - 0.28) * 3.2, 0, 1));
      // Keep the label chip inside the globe's frame (widths are measured once, not per frame).
      const chip = chipRefs.current[i];
      const w = chipWidths.current[i];
      if (chip && w) {
        const dx = Number(chip.dataset.dx);
        const left = x + dx - (dx < 0 ? w : 0);
        const bleed = size.width * 0.04;
        const shift = left < -bleed ? -bleed - left : left + w > size.width + bleed ? size.width + bleed - (left + w) : 0;
        chip.style.translate = `${shift.toFixed(1)}px 0`;
      }
    });
  });

  return <group ref={anchor} />;
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
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chipRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const chipWidths = useRef<number[]>([]);
  const [active, setActive] = useState(false);
  const [scale, setScale] = useState(1);

  // Callout offsets scale with the globe so small screens stay tidy.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(THREE.MathUtils.clamp(entry.contentRect.width / 640, 0.55, 1.15)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Measure label chips whenever their names or offsets change size.
  useEffect(() => {
    chipWidths.current = chipRefs.current.map((chip) => chip?.offsetWidth ?? 0);
  }, [scale, focusIndex]);

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
        <Environment frames={1} resolution={256} background={false}>
          <Lightformer form="rect" intensity={3.2} color="#f6e6c6" position={[-5, 4, 4]} scale={[9, 1.6, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={1.6} color="#c4a779" position={[6, -1, 3]} scale={[2.2, 7, 1]} target={[0, 0, 0]} />
          <Lightformer form="ring" intensity={1.1} color="#ffffff" position={[1, 6, -5]} scale={5} target={[0, 0, 0]} />
        </Environment>
        <directionalLight position={[-5, 6, 6]} intensity={1.4} color="#f4e4c4" />
        <directionalLight position={[6, -2, -5]} intensity={2.4} color="#c4a779" />
        <Rig focusIndex={focusIndex} drag={drag}>
          <GlobeBody />
          <LandDots focusIndex={focusIndex} tier={tier} calm={calm} />
          {MARKETS.map((_, i) => (
            <Marker key={i} index={i} focused={i === focusIndex} calm={calm} onHover={onHover} onSelect={onSelect} />
          ))}
          <LabelsTracker labelRefs={labelRefs} chipRefs={chipRefs} chipWidths={chipWidths} />
        </Rig>
      </Canvas>
      {MARKETS.map((m, i) => {
        const callout = CALLOUTS[m.id] ?? { dx: 40, dy: -30 };
        const dx = callout.dx * scale;
        const dy = callout.dy * scale;
        const focused = i === focusIndex;
        const name = scale < 0.8 && callout.short ? callout.short : m.name;
        return (
          <div
            key={m.id}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-10 opacity-0 will-change-transform"
          >
            <span
              className={`absolute left-0 top-0 h-px origin-left transition-colors duration-500 ${focused ? "bg-burgundy" : "bg-gold/70"}`}
              style={{ width: Math.hypot(dx, dy), transform: `rotate(${Math.atan2(dy, dx)}rad)` }}
            />
            <span
              ref={(el) => {
                chipRefs.current[i] = el;
              }}
              data-dx={dx}
              className={`eyebrow absolute whitespace-nowrap px-2 py-[3px] text-[9px] tracking-[0.18em] transition-colors duration-500 ${
                focused ? "bg-ink text-burgundy" : "bg-ink/85 text-ivory/85"
              }`}
              style={{ left: dx, top: dy, transform: `translate(${dx < 0 ? "-100%" : "0"}, -50%)` }}
            >
              {name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
