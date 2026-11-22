"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { decodeLandPoints } from "@/lib/geo/points";
import { MARKETS } from "@/lib/content";
import { latLonToVector3 } from "./geo";

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

/* Porcelain palette: an ivory sphere, ink land, burgundy network, gold hairlines. */
const PORCELAIN = "#f8f3ea";
const PORCELAIN_SHADE = "#dcd2c1";
const PORCELAIN_LIMB = "#c9bda7";
const INK = "#1c1914";
const BURGUNDY = "#6d1f2c";
const BURGUNDY_SOFT = "#9b3a4a";
const GOLD = "#8d6b3b";

/* ── Land dots ─────────────────────────────────────────────────────────── */

const dotVertex = /* glsl */ `
  attribute float aCountry;
  uniform float uFocus;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uView;
  uniform float uTime;
  varying float vFacing;
  varying float vNetwork;
  varying float vFocus;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normalize(position));
    vFacing = dot(n, normalize(-mv.xyz));
    vNetwork = step(-0.5, aCountry);
    vFocus = 1.0 - step(0.5, abs(aCountry - uFocus));
    // network dots sit slightly larger; the focused market breathes gently
    float size = mix(1.0, 1.34, vNetwork) + vFocus * (0.16 + 0.1 * sin(uTime * 2.2));
    gl_PointSize = uSize * uPixelRatio * uView * size * (4.6 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const dotFragment = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uBurgundy;
  uniform vec3 uBurgundySoft;
  varying float vFacing;
  varying float vNetwork;
  varying float vFocus;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float dotMask = smoothstep(0.5, 0.34, d);
    float rim = smoothstep(0.0, 0.42, vFacing);
    vec3 col = mix(uInk, mix(uBurgundy, uBurgundySoft, vFocus), vNetwork);
    float alpha = dotMask * rim * mix(0.42, 0.96, vNetwork);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

function LandDots({ focusIndex, tier, calm }: { focusIndex: number; tier: Tier; calm: boolean }) {
  const gl = useThree((s) => s.gl);
  const viewHeight = useThree((s) => s.size.height);
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
      uniforms: {
        uFocus: { value: focusIndex },
        uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
        uSize: { value: tier === "high" ? 2.75 : 2.55 },
        uView: { value: 1 },
        uTime: { value: 0 },
        uInk: { value: new THREE.Color(INK) },
        uBurgundy: { value: new THREE.Color(BURGUNDY) },
        uBurgundySoft: { value: new THREE.Color(BURGUNDY_SOFT) },
      },
    });
    return { geometry: geo, material: mat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, tier]);

  useEffect(() => {
    material.uniforms.uFocus.value = focusIndex;
  }, [focusIndex, material]);

  // Dots keep the same proportion to the globe at every screen size.
  useEffect(() => {
    material.uniforms.uView.value = THREE.MathUtils.clamp(viewHeight / 640, 0.4, 1.4);
  }, [viewHeight, material]);

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

/* ── Porcelain globe body and gold graticule ───────────────────────────── */

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
  uniform vec3 uShade;
  uniform vec3 uLimb;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(vV);
    vec3 l = normalize(vec3(-0.55, 0.62, 0.58));
    // wrapped light gives the soft, even fall-off of matte porcelain
    float wrap = dot(n, l) * 0.5 + 0.5;
    vec3 col = mix(uShade, uBase, smoothstep(0.12, 0.95, wrap));
    // gentle limb darkening for volume
    float facing = max(dot(n, v), 0.0);
    col = mix(col, uLimb, pow(1.0 - facing, 3.0) * 0.6);
    // a faint glaze highlight
    col += pow(max(dot(n, normalize(l + v)), 0.0), 90.0) * 0.2;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function GlobeBody() {
  const { body, graticule } = useMemo(() => {
    const body = new THREE.ShaderMaterial({
      vertexShader: bodyVertex,
      fragmentShader: bodyFragment,
      uniforms: {
        uBase: { value: new THREE.Color(PORCELAIN) },
        uShade: { value: new THREE.Color(PORCELAIN_SHADE) },
        uLimb: { value: new THREE.Color(PORCELAIN_LIMB) },
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
    const lineMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.22, depthWrite: false });
    return { body, graticule: new THREE.LineSegments(geo, lineMat) };
  }, []);

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
        <sphereGeometry args={[1, 96, 64]} />
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
        <meshBasicMaterial color={focused ? BURGUNDY_SOFT : BURGUNDY} toneMapped={false} depthWrite={false} transparent />
      </mesh>
      <mesh ref={ring} renderOrder={3}>
        <ringGeometry args={[0.02, 0.023, 48]} />
        <meshBasicMaterial color={GOLD} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {focused ? (
        <mesh renderOrder={3}>
          <ringGeometry args={[0.04, 0.0425, 64]} />
          <meshBasicMaterial color={BURGUNDY} transparent opacity={0.75} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
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
              className={`eyebrow absolute whitespace-nowrap border px-2 py-[3px] text-[9px] tracking-[0.18em] transition-colors duration-500 ${
                focused ? "border-burgundy/40 bg-ink text-burgundy" : "border-line-strong bg-ink/90 text-ivory/80"
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
